import { supabase } from '../config/supabase';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  conversation_id: string;
  created_at: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at: string;
}

class MessageService {
  // Send a message
  async sendMessage(senderId: string, receiverId: string, content: string, conversationId?: string): Promise<Message> {
    // If no conversationId, create a new conversation
    if (!conversationId) {
      const { data: conversation } = await supabase
        .from('conversations')
        .insert({
          participants: [senderId, receiverId],
          last_message: content,
          last_message_time: new Date().toISOString()
        })
        .select()
        .single();
      
      conversationId = conversation.id;
    }

    // Insert the message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
        conversation_id: conversationId,
        read: false
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation's last message
    await supabase
      .from('conversations')
      .update({
        last_message: content,
        last_message_time: new Date().toISOString()
      })
      .eq('id', conversationId);

    return message;
  }

  // Get conversation messages
  async getConversationMessages(conversationId: string): Promise<Message[]> {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return messages;
  }

  // Subscribe to messages in a conversation
  subscribeToMessages(conversationId: string, callback: (messages: Message[]) => void) {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async () => {
          const { data } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: true });
          callback(data || []);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  // Subscribe to user's conversations
  subscribeToConversations(userId: string, callback: (conversations: Conversation[]) => void) {
    const channel = supabase
      .channel(`conversations:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `participants=cs.{${userId}}`,
        },
        async () => {
          const { data } = await supabase
            .from('conversations')
            .select('*')
            .contains('participants', [userId])
            .order('last_message_time', { ascending: false });
          callback(data || []);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  // Mark messages as read for a user in a conversation
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  // Get or create a conversation between two users
  async getOrCreateConversation(userId1: string, userId2: string): Promise<string> {
    // Check for existing conversation
    const { data: existingConversations } = await supabase
      .from('conversations')
      .select('id')
      .contains('participants', [userId1])
      .contains('participants', [userId2])
      .single();

    if (existingConversations) {
      return existingConversations.id;
    }

    // Create new conversation
    const { data: newConversation } = await supabase
      .from('conversations')
      .insert({
        participants: [userId1, userId2],
        last_message: '',
        last_message_time: new Date().toISOString()
      })
      .select()
      .single();

    return newConversation.id;
  }
}

export const messageService = new MessageService(); 