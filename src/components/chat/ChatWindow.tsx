import React, { useState, useEffect, useRef } from 'react';
import { Message, subscribeToMessages } from '../../config/supabase';
import { messageService } from '../../services/messageService';
import { User } from '../../types/user';
import { auth } from '../../config/firebase';

interface ChatWindowProps {
  conversationId: string;
  otherUser: User;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, otherUser }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = auth.currentUser;

  useEffect(() => {
    // Load existing messages
    const loadMessages = async () => {
      const messages = await messageService.getConversationMessages(conversationId);
      setMessages(messages);
    };

    loadMessages();

    // Subscribe to new messages
    const subscription = subscribeToMessages(conversationId, (message) => {
      setMessages(prev => [...prev, message]);
      // Mark message as read if it's for current user
      if (message.receiver_id === currentUser?.uid) {
        messageService.markMessagesAsRead(conversationId, currentUser.uid);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, currentUser?.uid]);

  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await messageService.sendMessage(
        currentUser.uid,
        otherUser.id,
        newMessage,
        conversationId
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center p-4 border-b">
        <img
          src={otherUser.photoURL || '/default-avatar.png'}
          alt={otherUser.displayName}
          className="w-10 h-10 rounded-full mr-3"
        />
        <div>
          <h3 className="font-semibold">{otherUser.displayName}</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${
              message.sender_id === currentUser?.uid ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.sender_id === currentUser?.uid
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200'
              }`}
            >
              <p>{message.content}</p>
              <span className="text-xs opacity-75">
                {new Date(message.created_at).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 rounded-full border p-2 px-4 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-blue-500 text-white rounded-full px-6 py-2 hover:bg-blue-600 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}; 