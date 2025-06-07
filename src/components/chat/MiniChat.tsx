import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Badge,
  Collapse,
  styled,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Remove as MinimizeIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { messageService, Message } from '../../services/messageService';
import { formatDistanceToNow } from 'date-fns';

const ChatWindow = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  right: 20,
  width: 320,
  zIndex: 1000,
  borderRadius: '8px 8px 0 0',
  overflow: 'hidden',
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(1, 2),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
}));

const MessageBubble = styled(Box)<{ isOwn: boolean }>(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1, 2),
  borderRadius: 16,
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[100],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
  wordBreak: 'break-word',
}));

interface MiniChatProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onClose: () => void;
  userId: string;
}

const MiniChat: React.FC<MiniChatProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  onClose,
  userId,
}) => {
  const theme = useTheme();
  const [isExpanded, setIsExpanded] = useState(true);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeConversation = async () => {
      try {
        const id = await messageService.getOrCreateConversation(userId, recipientId);
        setConversationId(id);
      } catch (error) {
        console.error('Error initializing conversation:', error);
      }
    };

    initializeConversation();
  }, [userId, recipientId]);

  useEffect(() => {
    if (!conversationId) return;

    const unsubscribe = messageService.subscribeToMessages(conversationId, (newMessages) => {
      setMessages(newMessages);
    });

    // Mark messages as read when chat is opened
    messageService.markMessagesAsRead(conversationId, userId);

    return () => unsubscribe();
  }, [conversationId, userId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isExpanded) {
      scrollToBottom();
    }
  }, [messages, isExpanded]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    try {
      await messageService.sendMessage(userId, recipientId, message.trim());
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      // Handle error (show notification, etc.)
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <ChatWindow elevation={3}>
      <ChatHeader onClick={() => setIsExpanded(!isExpanded)}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          color="success"
          sx={{ mr: 1 }}
        >
          <Avatar src={recipientAvatar} sx={{ width: 32, height: 32 }}>
            {recipientName[0]}
          </Avatar>
        </Badge>
        <Typography variant="subtitle2" sx={{ flex: 1 }}>
          {recipientName}
        </Typography>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          sx={{ color: 'inherit', mr: 1 }}
        >
          <MinimizeIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          sx={{ color: 'inherit' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </ChatHeader>

      <Collapse in={isExpanded}>
        <Box
          sx={{
            height: 300,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
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
            {messages.map((msg) => (
              <MessageBubble key={msg.id} isOwn={msg.sender_id === userId}>
                <Typography variant="body2">{msg.content}</Typography>
                <Typography
                  variant="caption"
                  color={msg.sender_id === userId ? 'inherit' : 'text.secondary'}
                  sx={{ opacity: 0.8, display: 'block', mt: 0.5 }}
                >
                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                </Typography>
              </MessageBubble>
            ))}
            <div ref={messagesEndRef} />
          </Box>

          {/* Message Input */}
          <Box
            sx={{
              p: 1,
              borderTop: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <IconButton size="small">
              <EmojiIcon fontSize="small" />
            </IconButton>
            <IconButton size="small">
              <ImageIcon fontSize="small" />
            </IconButton>
            <TextField
              fullWidth
              size="small"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 20,
                },
              }}
            />
            <IconButton
              color="primary"
              size="small"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Collapse>
    </ChatWindow>
  );
};

export default MiniChat; 