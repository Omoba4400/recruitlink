import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  TextField,
  IconButton,
  Divider,
  Badge,
  InputAdornment,
  CircularProgress,
  useTheme,
  styled,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Image as ImageIcon,
  Circle as CircleIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import Header from '../components/layout/Header';
import { messageService, Message, Conversation } from '../services/messageService';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import ChatWindow from '../components/chat/ChatWindow';
import GroupChatWindow from '../components/chat/GroupChatWindow';
import GroupManager from '../components/chat/GroupManager';
import { User } from '../types/user';
import { getUserProfile } from '../services/user.service';
import { Group } from '../types/group';

const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  height: 'calc(100vh - 64px)', // Subtract header height
  marginTop: 64, // Header height
}));

const ConversationsList = styled(Paper)(({ theme }) => ({
  width: 320,
  borderRight: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
}));

const ChatArea = styled(Paper)(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      sx={{ flex: 1, overflow: 'hidden', display: value === index ? 'flex' : 'none', flexDirection: 'column' }}
    >
      {value === index && children}
    </Box>
  );
};

const MessageBubble = styled(Box)<{ isOwn: boolean }>(({ theme, isOwn }) => ({
  maxWidth: '70%',
  padding: theme.spacing(1, 2),
  borderRadius: 20,
  backgroundColor: isOwn ? theme.palette.primary.main : theme.palette.grey[100],
  color: isOwn ? theme.palette.primary.contrastText : theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  alignSelf: isOwn ? 'flex-end' : 'flex-start',
}));

const Messages: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUsers, setOtherUsers] = useState<Map<string, User>>(new Map());
  const [tabValue, setTabValue] = useState(0);

  const getOtherParticipantId = (conversation: Conversation) => {
    return conversation.participants.find(id => id !== user?.uid) || '';
  };

  // Effect for fetching user profiles
  useEffect(() => {
    const fetchUserProfiles = async (conversations: Conversation[]) => {
      for (const conversation of conversations) {
        const otherUserId = getOtherParticipantId(conversation);
        if (!otherUsers.has(otherUserId)) {
          try {
            const profile = await getUserProfile(otherUserId);
            if (profile) {
              setOtherUsers(prev => new Map(prev).set(otherUserId, profile as User));
            }
          } catch (error) {
            console.error('Error fetching user profile:', error);
          }
        }
      }
    };

    if (conversations.length > 0) {
      fetchUserProfiles(conversations);
    }
  }, [conversations, user?.uid, otherUsers]);

  // Effect for conversation subscription
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const setupSubscription = async () => {
      try {
        unsubscribe = messageService.subscribeToConversations(user.uid, (newConversations) => {
          setConversations(newConversations);
          setLoading(false);
        });
      } catch (error) {
        console.error('Error setting up conversation subscription:', error);
        setLoading(false);
      }
    };

    setupSubscription();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user, navigate]);

  const filteredConversations = conversations.filter(conversation => {
    const searchLower = searchQuery.toLowerCase();
    const otherUserId = getOtherParticipantId(conversation);
    const otherUser = otherUsers.get(otherUserId);
    return (
      conversation.last_message?.toLowerCase().includes(searchLower) ||
      otherUser?.displayName.toLowerCase().includes(searchLower) ||
      ''
    );
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setSelectedConversation(null);
    setSelectedGroup(null);
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setSelectedConversation(null);
  };

  const handleGroupLeave = () => {
    setSelectedGroup(null);
  };

  return (
    <>
      <Header />
      <ChatContainer>
        {/* Left Sidebar */}
        <ConversationsList elevation={0}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Direct" />
            {profile?.userType === 'athlete' && <Tab label="Groups" />}
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search messages"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
            <Divider />
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {loading && filteredConversations.length > 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : filteredConversations.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
                  <Typography color="text.secondary" align="center">
                    {searchQuery ? "No conversations match your search" : "No messages yet. Start a conversation!"}
                  </Typography>
                </Box>
              ) : (
                filteredConversations.map((conversation) => {
                  const otherUserId = getOtherParticipantId(conversation);
                  const otherUser = otherUsers.get(otherUserId);
                  return (
                    <ListItem
                      key={conversation.id}
                      button
                      selected={selectedConversation === conversation.id}
                      onClick={() => {
                        setSelectedConversation(conversation.id);
                        setSelectedGroup(null);
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover,
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar src={otherUser?.photoURL}>
                          {otherUser?.displayName[0]?.toUpperCase() || otherUserId[0]?.toUpperCase()}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={otherUser?.displayName || otherUserId}
                        secondary={conversation.last_message}
                        secondaryTypographyProps={{
                          noWrap: true,
                          style: {
                            maxWidth: '180px',
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ ml: 1, minWidth: 60 }}
                      >
                        {conversation.last_message_time && formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                      </Typography>
                    </ListItem>
                  );
                })
              )}
            </List>
          </TabPanel>

          {profile?.userType === 'athlete' && (
            <TabPanel value={tabValue} index={1}>
              <GroupManager onGroupSelect={handleGroupSelect} />
            </TabPanel>
          )}
        </ConversationsList>

        {/* Chat Area */}
        <ChatArea>
          {selectedConversation ? (
            (() => {
              const conversation = conversations.find(c => c.id === selectedConversation);
              const otherUser = conversation ? otherUsers.get(getOtherParticipantId(conversation)) : undefined;
              
              if (!otherUser) {
                return (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'text.secondary',
                    }}
                  >
                    <Typography variant="h6">Loading conversation...</Typography>
                  </Box>
                );
              }

              return (
                <ChatWindow
                  conversationId={selectedConversation}
                  otherUser={otherUser}
                />
              );
            })()
          ) : selectedGroup ? (
            <GroupChatWindow
              group={selectedGroup}
              onLeaveGroup={handleGroupLeave}
            />
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <Typography variant="h6">
                {tabValue === 0
                  ? "Select a conversation to start messaging"
                  : "Select or create a group to start chatting"
                }
              </Typography>
            </Box>
          )}
        </ChatArea>
      </ChatContainer>
    </>
  );
};

export default Messages; 