import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Paper,
  CircularProgress,
  useTheme,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { Message } from '../../config/supabase';
import { messageService } from '../../services/messageService';
import { User } from '../../types/user';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { formatDistanceToNow } from 'date-fns';

interface ChatWindowProps {
  conversationId: string;
  otherUser: User;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ conversationId, otherUser }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversationId || !currentUser) return;

    setLoading(true);

    // Initial fetch of messages
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await messageService.getConversationMessages(conversationId);
        setMessages(fetchedMessages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const unsubscribe = messageService.subscribeToMessages(conversationId, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    // Mark messages as read
    const markAsRead = async () => {
      try {
        await messageService.markMessagesAsRead(conversationId, currentUser.uid);
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    markAsRead();

    return () => {
      unsubscribe();
    };
  }, [conversationId, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await messageService.sendMessage(
        currentUser.uid,
        otherUser.uid,
        newMessage.trim(),
        conversationId
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Avatar src={otherUser.photoURL} alt={otherUser.displayName}>
          {otherUser.displayName[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ ml: 2 }}>
          <Typography variant="h6">{otherUser.displayName}</Typography>
        </Box>
      </Paper>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender_id === currentUser?.uid ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 1,
                px: 2,
                maxWidth: '70%',
                backgroundColor: message.sender_id === currentUser?.uid
                  ? theme.palette.primary.main
                  : theme.palette.grey[100],
                color: message.sender_id === currentUser?.uid
                  ? theme.palette.primary.contrastText
                  : theme.palette.text.primary,
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message Input */}
      <Paper
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          borderTop: `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          fullWidth
          size="small"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          sx={{ flex: 1 }}
        />
        <IconButton
          color="primary"
          type="submit"
          disabled={!newMessage.trim()}
        >
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default ChatWindow; 