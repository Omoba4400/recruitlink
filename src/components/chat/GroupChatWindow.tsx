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
  AvatarGroup,
  Tooltip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Menu,
  MenuItem,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as InviteIcon,
  ExitToApp as LeaveIcon,
} from '@mui/icons-material';
import { Group, GroupMessage } from '../../types/group';
import { groupService } from '../../services/groupService';
import { User } from '../../types/user';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';
import { formatDistanceToNow } from 'date-fns';

interface GroupChatWindowProps {
  group: Group;
  onLeaveGroup: () => void;
}

const GroupChatWindow: React.FC<GroupChatWindowProps> = ({ group, onLeaveGroup }) => {
  const theme = useTheme();
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<User[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!group.id || !currentUser) return;

    setLoading(true);

    // Initial fetch of messages
    const fetchMessages = async () => {
      try {
        const fetchedMessages = await groupService.getGroupMessages(group.id);
        setMessages(fetchedMessages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();

    // Subscribe to real-time updates
    const unsubscribe = groupService.subscribeToGroupMessages(group.id, (updatedMessages) => {
      setMessages(updatedMessages);
    });

    return () => {
      unsubscribe();
    };
  }, [group.id, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    try {
      await groupService.sendGroupMessage(
        group.id,
        currentUser.uid,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await groupService.leaveGroup(group.id, currentUser!.uid);
      onLeaveGroup();
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
      {/* Group Chat Header */}
      <Paper
        elevation={1}
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={group.photoURL} alt={group.name}>
            {group.name[0]?.toUpperCase()}
          </Avatar>
          <Box sx={{ ml: 2 }}>
            <Typography variant="h6">{group.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {group.members.length} members • {group.sport}
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleLeaveGroup}>
              <LeaveIcon sx={{ mr: 1 }} />
              Leave Group
            </MenuItem>
          </Menu>
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
              flexDirection: 'column',
              alignItems: message.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Box
              sx={{
                maxWidth: '70%',
                bgcolor: message.senderId === currentUser?.uid ? 'primary.main' : 'grey.100',
                color: message.senderId === currentUser?.uid ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                p: 1.5,
                wordBreak: 'break-word',
              }}
            >
              <Typography variant="body1">{message.content}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
            </Typography>
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
          multiline
          maxRows={4}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          variant="outlined"
          size="small"
        />
        <IconButton type="submit" color="primary" disabled={!newMessage.trim()}>
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
};

export default GroupChatWindow; 