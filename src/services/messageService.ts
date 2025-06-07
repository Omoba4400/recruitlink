import { supabase, Message, Conversation } from '../config/supabase';
import { User } from '../types/user';

export type { Message, Conversation };

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

  // Get user conversations
  async getUserConversations(userId: string): Promise<Conversation[]> {
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participants', [userId])
      .order('last_message_time', { ascending: false });

    if (error) throw error;
    return conversations;
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .update({ read: true })
      .eq('conversation_id', conversationId)
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;
  }

  // Get unread message count
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('receiver_id', userId)
      .eq('read', false);

    if (error) throw error;
    return count || 0;
  }

  // Delete message
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('sender_id', userId);

    if (error) throw error;
  }

  // Update user presence
  async updatePresence(userId: string, online: boolean): Promise<void> {
    if (online) {
      await supabase.channel(`presence:${userId}`).track({ 
        user_id: userId,
        online_at: new Date().toISOString()
      });
    }
  }

  // Add subscription methods
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

  // Add this method
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