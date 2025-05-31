import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Avatar,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Badge,
  TextField,
  InputAdornment,
  Drawer,
  Tooltip,
  Chip,
  Grid,
} from '@mui/material';
import {
  Home as HomeIcon,
  Explore as ExploreIcon,
  Event as EventIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Description as DescriptionIcon,
  Settings as SettingsIcon,
  Groups as GroupsIcon,
  Search as SearchIcon,
  Mail as MailIcon,
  Assessment as AssessmentIcon,
  Business as BusinessIcon,
  Handshake as HandshakeIcon,
  MonetizationOn as SponsorshipIcon,
  ThumbUp,
  Comment,
  Share,
  EmojiEvents,
  Image,
  Poll,
  CalendarMonth,
  Notifications,
  Message,
  Star,
  Verified,
  PinDrop,
  Insights,
  Lightbulb,
  VideoLibrary,
  MoreVert,
  ChevronLeft,
  ChevronRight,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';

// Post Types
interface Post {
  id: string;
  type: 'text' | 'media' | 'match' | 'event' | 'sponsor' | 'achievement' | 'performance' | 'application';
  content: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  media?: string;
  metrics?: {
    value: number;
    label: string;
    change?: number;
  };
}

// Role-specific feed data
const roleBasedPosts: Record<string, Post[]> = {
  athlete: [
    {
      id: 'a1',
      type: 'performance',
      content: 'Weekly Performance Update',
      author: {
        name: 'Performance Tracker',
        avatar: '📊',
        role: 'System',
      },
      timestamp: '1 hour ago',
      likes: 0,
      comments: 0,
      shares: 0,
      metrics: {
        value: 85,
        label: 'Training Score',
        change: 5,
      },
    },
    {
      id: 'a2',
      type: 'event',
      content: 'You\'ve been invited to Summer Training Camp!',
      author: {
        name: 'Team Thunder',
        avatar: 'T',
        role: 'Team',
      },
      timestamp: '2 hours ago',
      likes: 0,
      comments: 0,
      shares: 0,
    },
  ],
  coach: [
    {
      id: 'c1',
      type: 'application',
      content: 'New athlete application received',
      author: {
        name: 'John Smith',
        avatar: 'J',
        role: 'Athlete',
      },
      timestamp: '1 hour ago',
      likes: 0,
      comments: 0,
      shares: 0,
      metrics: {
        value: 92,
        label: 'Skill Rating',
      },
    },
    {
      id: 'c2',
      type: 'performance',
      content: 'Top Performers This Week',
      author: {
        name: 'Performance Analytics',
        avatar: '📈',
        role: 'System',
      },
      timestamp: '3 hours ago',
      likes: 0,
      comments: 0,
      shares: 0,
    },
  ],
  team: [
    {
      id: 't1',
      type: 'application',
      content: 'New team application received',
      author: {
        name: 'Mike Johnson',
        avatar: 'M',
        role: 'Athlete',
      },
      timestamp: '1 hour ago',
      likes: 0,
      comments: 0,
      shares: 0,
    },
    {
      id: 't2',
      type: 'sponsor',
      content: 'New sponsorship opportunity available',
      author: {
        name: 'Nike Sports',
        avatar: 'N',
        role: 'Company',
      },
      timestamp: '4 hours ago',
      likes: 0,
      comments: 0,
      shares: 0,
    },
  ],
  company: [
    {
      id: 'co1',
      type: 'performance',
      content: 'Sponsorship ROI Report',
      author: {
        name: 'Analytics Dashboard',
        avatar: '📊',
        role: 'System',
      },
      timestamp: '1 hour ago',
      likes: 0,
      comments: 0,
      shares: 0,
      metrics: {
        value: 156,
        label: 'Engagement Rate',
        change: 12,
      },
    },
    {
      id: 'co2',
      type: 'application',
      content: 'New sponsorship request',
      author: {
        name: 'Team Thunder',
        avatar: 'T',
        role: 'Team',
      },
      timestamp: '2 hours ago',
      likes: 0,
      comments: 0,
      shares: 0,
    },
  ],
};

// Add mock users data
const mockUsers = {
  'user1': {
    id: 'user1',
    name: 'John Smith',
    role: 'Athlete',
    avatar: 'J',
    sport: 'Basketball',
    team: 'Team Thunder',
    isVerified: true,
  },
  'user2': {
    id: 'user2',
    name: 'Sarah Johnson',
    role: 'Coach',
    avatar: 'S',
    sport: 'Basketball',
    team: 'LA Lakers',
    isVerified: true,
  },
  'user3': {
    id: 'user3',
    name: 'Team Thunder',
    role: 'Team',
    avatar: 'T',
    sport: 'Basketball',
    isVerified: true,
  },
};

// Left Sidebar Component
const LeftSidebar = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isCollapsed, setIsCollapsed] = useState(false);

  const sidebarWidth = isCollapsed ? 65 : 240;

  const getMenuItems = () => {
    switch (user?.userType) {
      case 'athlete':
        return [
          { icon: <HomeIcon />, label: 'Feed', path: '/home', emoji: '👟' },
          { icon: <ExploreIcon />, label: 'Explore', path: '/explore' },
          { icon: <EventIcon />, label: 'Events', path: '/events' },
          { icon: <TrendingUpIcon />, label: 'Stats', path: '/stats' },
          { icon: <PeopleIcon />, label: 'Connections', path: '/connections' },
          { icon: <DescriptionIcon />, label: 'Applications', path: '/applications' },
        ];
      case 'coach':
        return [
          { icon: <HomeIcon />, label: 'Feed', path: '/home', emoji: '🧢' },
          { icon: <ExploreIcon />, label: 'Explore', path: '/explore' },
          { icon: <EventIcon />, label: 'Events', path: '/events' },
          { icon: <PeopleIcon />, label: 'Connections', path: '/connections' },
          { icon: <GroupsIcon />, label: 'Team Management', path: '/team-management' },
        ];
      case 'company':
        return [
          { icon: <HomeIcon />, label: 'Feed', path: '/home', emoji: '🏢' },
          { icon: <ExploreIcon />, label: 'Explore', path: '/explore' },
          { icon: <EventIcon />, label: 'Events', path: '/events' },
          { icon: <PeopleIcon />, label: 'Connections', path: '/connections' },
          { icon: <SponsorshipIcon />, label: 'Sponsorships', path: '/sponsorships' },
        ];
      case 'team':
        return [
          { icon: <HomeIcon />, label: 'Feed', path: '/home', emoji: '👥' },
          { icon: <GroupsIcon />, label: 'Team Roster', path: '/roster' },
          { icon: <SearchIcon />, label: 'Scouting', path: '/scouting' },
          { icon: <EventIcon />, label: 'Events', path: '/events' },
          { icon: <MailIcon />, label: 'Applications', path: '/applications' },
          { icon: <AssessmentIcon />, label: 'Stats', path: '/stats' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <Box
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        width: sidebarWidth,
        position: 'fixed',
        top: 64,
        left: 0,
        bottom: 0,
        borderRight: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: 'primary.dark',
        backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
        zIndex: 1,
        overflow: 'hidden',
        transition: theme.transitions.create(['width'], {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton
          onClick={() => setIsCollapsed(!isCollapsed)}
          sx={{ color: 'primary.light' }}
        >
          {isCollapsed ? <ChevronRight /> : <ChevronLeft />}
        </IconButton>
      </Box>

      <List sx={{ pt: 0 }}>
        {user?.userType && !isCollapsed && (
          <>
            <Typography
              variant="overline"
              sx={{
                px: 2,
                py: 1,
                display: 'block',
                color: 'primary.light',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              {menuItems[0]?.emoji} {user.userType.charAt(0).toUpperCase() + user.userType.slice(1)} Dashboard
            </Typography>
            <Divider sx={{ mb: 2 }} />
          </>
        )}
        {menuItems.map((item) => (
          <ListItem
            component="button"
            key={item.label}
            onClick={() => navigate(item.path)}
            sx={{
              py: { xs: 2, sm: 1.5 },
              px: isCollapsed ? 1 : 2,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
              '& .MuiListItemIcon-root': {
                minWidth: isCollapsed ? 0 : { xs: 56, sm: 40 },
                color: 'primary.light',
                '& svg': {
                  fontSize: { xs: '1.75rem', sm: '1.5rem' }
                }
              },
              '& .MuiListItemText-primary': {
                fontSize: { xs: '1.1rem', sm: '1rem' },
                color: 'primary.contrastText',
                opacity: isCollapsed ? 0 : 1,
                transition: theme.transitions.create(['opacity'], {
                  duration: theme.transitions.duration.enteringScreen,
                })
              },
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              backgroundColor: 'transparent'
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            {!isCollapsed && <ListItemText primary={item.label} />}
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

// Main Feed Component
const MainFeed = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (user?.userType) {
      setPosts(roleBasedPosts[user.userType] || []);
    }
  }, [user?.userType]);

  const renderPostContent = (post: Post) => {
    switch (post.type) {
      case 'performance':
        return (
          <Box sx={{ mt: { xs: 3, sm: 2 } }}>
            <Typography 
              variant="h6" 
              color="primary"
              sx={{ fontSize: { xs: '1.5rem', sm: '1.25rem' } }}
            >
              {post.metrics?.value}%
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
            >
              {post.metrics?.label}
              {post.metrics?.change && (
                <Chip
                  label={`${post.metrics.change > 0 ? '+' : ''}${post.metrics.change}%`}
                  color={post.metrics.change > 0 ? 'success' : 'error'}
                  size={isMobile ? "medium" : "small"}
                  sx={{ ml: 1 }}
                />
              )}
            </Typography>
          </Box>
        );
      case 'application':
        return (
          <Box sx={{ mt: { xs: 3, sm: 2 } }}>
            <Button 
              variant="outlined" 
              size={isMobile ? "large" : "small"} 
              sx={{ 
                mr: 1,
                fontSize: { xs: '1rem', sm: '0.875rem' },
                py: { xs: 1.5, sm: 1 }
              }}
            >
              View Details
            </Button>
            <Button 
              variant="contained" 
              size={isMobile ? "large" : "small"}
              sx={{ 
                fontSize: { xs: '1rem', sm: '0.875rem' },
                py: { xs: 1.5, sm: 1 }
              }}
            >
              Take Action
            </Button>
          </Box>
        );
      default:
        return (
          <Typography 
            variant="body1" 
            paragraph
            sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}
          >
            {post.content}
          </Typography>
        );
    }
  };

  return (
    <Box>
      {/* Create Post */}
      <Paper sx={{ p: { xs: 3, sm: 2 }, mb: 3 }}>
        <Box 
          display="flex" 
          alignItems="center" 
          mb={2}
          sx={{
            '& .MuiAvatar-root': {
              width: { xs: 48, sm: 40 },
              height: { xs: 48, sm: 40 },
              mr: { xs: 3, sm: 2 }
            }
          }}
        >
          <Avatar>{user?.displayName?.[0]}</Avatar>
          <TextField
            fullWidth
            placeholder="Share your thoughts..."
            variant="outlined"
            size={isMobile ? "medium" : "small"}
            sx={{
              '& .MuiInputBase-input': {
                fontSize: { xs: '1.1rem', sm: '1rem' },
                py: { xs: 1.5, sm: 1 }
              }
            }}
          />
        </Box>
        <Box 
          display="flex" 
          justifyContent="space-between"
          sx={{
            '& .MuiIconButton-root': {
              p: { xs: 2, sm: 1 },
              '& svg': {
                fontSize: { xs: '1.75rem', sm: '1.5rem' }
              }
            }
          }}
        >
          <Box>
            <IconButton size={isMobile ? "large" : "small"}>
              <Image />
            </IconButton>
            <IconButton size={isMobile ? "large" : "small"}>
              <VideoLibrary />
            </IconButton>
            <IconButton size={isMobile ? "large" : "small"}>
              <Poll />
            </IconButton>
          </Box>
          <Button 
            variant="contained" 
            size={isMobile ? "large" : "small"}
            sx={{ 
              px: { xs: 4, sm: 3 },
              py: { xs: 1.5, sm: 1 },
              fontSize: { xs: '1.1rem', sm: '0.875rem' }
            }}
          >
            Post
          </Button>
        </Box>
      </Paper>

      {/* Pinned/Announcements Section */}
      <Paper sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}>
        <Box display="flex" alignItems="center" mb={1}>
          <PinDrop color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Pinned Announcements</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Important updates and announcements will appear here
        </Typography>
      </Paper>

      {/* Role-specific Feed Header */}
      <Typography variant="h6" gutterBottom>
        {user?.userType === 'athlete' && 'Your Performance & Updates'}
        {user?.userType === 'coach' && 'Athlete Insights & Applications'}
        {user?.userType === 'team' && 'Team Updates & Opportunities'}
        {user?.userType === 'company' && 'Sponsorship Analytics & Requests'}
      </Typography>

      {/* Posts Feed */}
      {posts.map((post) => (
        <Paper key={post.id} sx={{ p: { xs: 3, sm: 2 }, mb: 3 }}>
          <Box 
            display="flex" 
            alignItems="center" 
            mb={2}
            sx={{
              '& .MuiAvatar-root': {
                width: { xs: 48, sm: 40 },
                height: { xs: 48, sm: 40 },
                mr: { xs: 3, sm: 2 }
              }
            }}
          >
            <Avatar>{post.author.avatar}</Avatar>
            <Box flex={1}>
              <Box display="flex" alignItems="center">
                <Typography 
                  variant="subtitle1"
                  sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}
                >
                  {post.author.name}
                </Typography>
                {post.author.role === 'Verified' && (
                  <Tooltip title="Verified Profile">
                    <Verified 
                      color="primary" 
                      sx={{ 
                        ml: 0.5, 
                        fontSize: { xs: '1.25rem', sm: '1rem' } 
                      }} 
                    />
                  </Tooltip>
                )}
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
              >
                {post.timestamp} • {post.author.role}
              </Typography>
            </Box>
            <IconButton 
              size={isMobile ? "large" : "small"}
              sx={{
                p: { xs: 2, sm: 1 },
                '& svg': {
                  fontSize: { xs: '1.75rem', sm: '1.5rem' }
                }
              }}
            >
              <MoreVert />
            </IconButton>
          </Box>
          {renderPostContent(post)}
          <Box 
            display="flex" 
            justifyContent="space-between" 
            mt={2}
            sx={{
              '& .MuiIconButton-root': {
                p: { xs: 2, sm: 1 },
                '& svg': {
                  fontSize: { xs: '1.75rem', sm: '1.5rem' }
                }
              }
            }}
          >
            <Box>
              <IconButton size={isMobile ? "large" : "small"}>
                <ThumbUp />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  }}
                >
                  {post.likes}
                </Typography>
              </IconButton>
              <IconButton size={isMobile ? "large" : "small"}>
                <Comment />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  }}
                >
                  {post.comments}
                </Typography>
              </IconButton>
              <IconButton size={isMobile ? "large" : "small"}>
                <Share />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    ml: 1,
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  }}
                >
                  {post.shares}
                </Typography>
              </IconButton>
            </Box>
            {post.metrics && (
              <Chip
                icon={<Insights />}
                label={`${post.metrics.value} views`}
                size={isMobile ? "medium" : "small"}
                variant="outlined"
                sx={{
                  '& .MuiChip-label': {
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  }
                }}
              />
            )}
          </Box>
        </Paper>
      ))}

      {/* Tips & Insights Section */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={1}>
          <Lightbulb color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Tips & Insights</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {user?.userType === 'athlete' && 'Training tips and performance insights'}
          {user?.userType === 'coach' && 'Recruiting strategies and athlete development'}
          {user?.userType === 'team' && 'Team management and event planning'}
          {user?.userType === 'company' && 'Sponsorship opportunities and brand growth'}
        </Typography>
      </Paper>
    </Box>
  );
};

// Right Sidebar Component
const RightSidebar = () => {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleProfileClick = (userId: string) => {
    navigate(`/view-profile/${userId}`);
  };

  return (
    <Box>
      {/* Suggested Connections */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 2 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.25rem', sm: '1.125rem' } }}
          >
            Suggested Connections
          </Typography>
          <List>
            {Object.values(mockUsers).map((profile) => (
              <ListItem
                key={profile.id}
                sx={{
                  cursor: 'pointer',
                  py: { xs: 2, sm: 1.5 },
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                  '& .MuiAvatar-root': {
                    width: { xs: 48, sm: 40 },
                    height: { xs: 48, sm: 40 }
                  },
                  '& .MuiListItemText-primary': {
                    fontSize: { xs: '1.1rem', sm: '1rem' }
                  },
                  '& .MuiListItemText-secondary': {
                    fontSize: { xs: '1rem', sm: '0.875rem' }
                  },
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 1
                }}
                onClick={() => handleProfileClick(profile.id)}
              >
                <ListItemAvatar>
                  <Avatar>{profile.avatar}</Avatar>
                </ListItemAvatar>
                <Box flex={1} minWidth={0}>
                  <Box display="flex" alignItems="center">
                    <Typography noWrap>
                      {profile.name}
                    </Typography>
                    {profile.isVerified && (
                      <Tooltip title="Verified Profile">
                        <Verified 
                          color="primary" 
                          sx={{ 
                            ml: 0.5, 
                            fontSize: { xs: '1.25rem', sm: '1rem' } 
                          }} 
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    noWrap
                  >
                    {`${profile.role} • ${profile.sport}`}
                  </Typography>
                </Box>
                <Button 
                  size={isMobile ? "large" : "small"} 
                  variant="outlined"
                  sx={{ 
                    fontSize: { xs: '1rem', sm: '0.875rem' },
                    py: { xs: 1.5, sm: 1 },
                    minWidth: 'auto',
                    whiteSpace: 'nowrap'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement connect logic
                  }}
                >
                  Connect
                </Button>
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Top Athletes */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Athletes
          </Typography>
          <List>
            <ListItem
              sx={{
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
              onClick={() => handleProfileClick('user1')}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>J</Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box display="flex" alignItems="center">
                    John Smith
                    <Verified color="primary" sx={{ ml: 0.5, fontSize: 16 }} />
                  </Box>
                }
                secondary="Basketball • 98% Match"
              />
              <Chip
                icon={<TrendingUpIcon />}
                label="Trending"
                color="primary"
                size="small"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Next Event */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 3, sm: 2 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1.25rem', sm: '1.125rem' } }}
          >
            Your Next Event
          </Typography>
          <Box 
            display="flex" 
            alignItems="center"
            sx={{
              '& svg': {
                fontSize: { xs: '1.75rem', sm: '1.5rem' },
                mr: { xs: 2, sm: 1 }
              }
            }}
          >
            <EventIcon color="primary" />
            <Box>
              <Typography 
                variant="subtitle1"
                sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}
              >
                Summer Training Camp
              </Typography>
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
              >
                June 15, 2024
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Stat Snapshot (for athletes) */}
      {user?.userType === 'athlete' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Stat Snapshot
            </Typography>
            <Box>
              <Typography variant="h4" color="primary">
                85%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall Performance
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Verified Badge Info */}
      <Card>
        <CardContent sx={{ p: { xs: 3, sm: 2 } }}>
          <Box 
            display="flex" 
            alignItems="center" 
            mb={1}
            sx={{
              '& svg': {
                fontSize: { xs: '1.75rem', sm: '1.5rem' },
                mr: { xs: 2, sm: 1 }
              }
            }}
          >
            <Verified color="primary" />
            <Typography 
              variant="h6"
              sx={{ fontSize: { xs: '1.25rem', sm: '1.125rem' } }}
            >
              Verified Profiles
            </Typography>
          </Box>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
          >
            Verified profiles have been authenticated by our team. Look for the badge to ensure you're connecting with legitimate users.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

const Home = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isCollapsed, setIsCollapsed] = useState(false);
  const sidebarWidth = isCollapsed ? 65 : 240;

  if (!user) return null;

  return (
    <Box>
      <Header />
      <Box sx={{ display: 'flex', minHeight: 'calc(100vh - 64px)' }}>
        <LeftSidebar />
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: { xs: 7, sm: 8 },
            ml: { xs: 0, md: `${sidebarWidth}px` },
            transition: theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            width: { md: `calc(100% - ${sidebarWidth}px)` },
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            gap: 3,
            flexDirection: { xs: 'column', md: 'row' }
          }}>
            {/* Main Feed */}
            <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
              <MainFeed />
            </Box>

            {/* Right Sidebar */}
            <Box sx={{ 
              width: { xs: '100%', md: '340px' },
              flexShrink: 0
            }}>
              <Box sx={{ position: 'sticky', top: 88 }}>
                <RightSidebar />
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Home; 