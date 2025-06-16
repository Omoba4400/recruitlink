import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Avatar,
  Box,
  Menu,
  MenuItem,
  styled,
  alpha,
  Button,
  useMediaQuery,
  useTheme,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications,
  Message,
  AccountCircle,
  Menu as MenuIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Check as AcceptIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { User, ConnectionRequest } from '../../types/user';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { clearUser } from '../../store/slices/authSlice';
import UnreadMessagesBadge from '../UnreadMessagesBadge';
import { useSnackbar } from 'notistack';
import { getConnectionRequests, acceptConnectionRequest, rejectConnectionRequest, getUserProfile } from '../../services/user.service';
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../../services/notification.service';
import { NotificationWithSender } from '../../types/notification';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [connectionRequests, setConnectionRequests] = useState<(ConnectionRequest & { sender: User })[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationWithSender[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user) as User | null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { enqueueSnackbar } = useSnackbar();

  const fetchConnectionRequests = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const requests = await getConnectionRequests(user.id, 'received');
      
      // Fetch sender details for each request
      const requestsWithSenders = await Promise.all(
        requests.map(async (request) => {
          const sender = await getUserProfile(request.senderId);
          return {
            ...request,
            sender: sender as User,
          };
        })
      );

      setConnectionRequests(requestsWithSenders);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const fetchedNotifications = await getNotifications(user.id);
      setNotifications(fetchedNotifications);
      setUnreadCount(fetchedNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch requests on mount and every 30 seconds
  useEffect(() => {
    fetchConnectionRequests();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchConnectionRequests();
      fetchNotifications();
    }, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const handleAcceptRequest = async (request: NotificationWithSender) => {
    if (!user?.id || !request.id || !request.senderId || request.type !== 'connection_request') return;

    try {
      await acceptConnectionRequest(request.id, request.senderId, user.id);
      setNotifications(prev => prev.filter(n => n.id !== request.id));
      enqueueSnackbar('Connection request accepted', { variant: 'success' });
    } catch (error) {
      console.error('Error accepting connection request:', error);
      enqueueSnackbar('Failed to accept connection request', { variant: 'error' });
    }
  };

  const handleRejectRequest = async (request: NotificationWithSender) => {
    if (!request.id || request.type !== 'connection_request') return;

    try {
      await rejectConnectionRequest(request.id);
      setNotifications(prev => prev.filter(n => n.id !== request.id));
      enqueueSnackbar('Connection request rejected', { variant: 'info' });
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      enqueueSnackbar('Failed to reject connection request', { variant: 'error' });
    }
  };

  const handleNotificationClick = async (notification: NotificationWithSender) => {
    try {
      // Mark notification as read
      await markNotificationAsRead(notification.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Navigate based on notification type
      switch (notification.type) {
        case 'post_like':
        case 'post_comment':
          if (notification.postId) {
            navigate(`/post/${notification.postId}`);
          }
          break;
        case 'new_message':
          if (notification.messageId) {
            navigate(`/messages`);
          }
          break;
        case 'connection_request':
        case 'connection_accepted':
        case 'new_follower':
          if (notification.senderId) {
            navigate(`/profile/${notification.senderId}`);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;
    try {
      await markAllNotificationsAsRead(user.id);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const renderNotificationContent = (notification: NotificationWithSender) => {
    const senderName = notification.sender?.displayName || 'Someone';
    
    switch (notification.type) {
      case 'connection_request':
        return (
          <>
            <ListItemText
              primary={senderName}
              secondary="wants to connect with you"
              sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                color="error"
                onClick={() => handleRejectRequest(notification)}
              >
                <RejectIcon />
              </IconButton>
              <IconButton
                edge="end"
                color="primary"
                onClick={() => handleAcceptRequest(notification)}
              >
                <AcceptIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </>
        );
      case 'post_like':
        return (
          <ListItemText
            primary={`${senderName} liked your post`}
            sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
          />
        );
      case 'post_comment':
        return (
          <ListItemText
            primary={`${senderName} commented on your post`}
            secondary={notification.content}
            sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
          />
        );
      case 'new_message':
        return (
          <ListItemText
            primary={`New message from ${senderName}`}
            secondary={notification.content}
            sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
          />
        );
      case 'connection_accepted':
        return (
          <ListItemText
            primary={`${senderName} accepted your connection request`}
            sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
          />
        );
      case 'new_follower':
        return (
          <ListItemText
            primary={`${senderName} started following you`}
            sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
          />
        );
      default:
        return (
          <ListItemText
            primary={notification.title}
            secondary={notification.content}
            sx={{ color: notification.read ? 'text.secondary' : 'text.primary' }}
          />
        );
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    handleMenuClose();
    console.log('Header - Profile click - User:', user);
    
    if (user?.uid) {
      const profileUrl = `/profile/${user.uid}`;
      console.log('Header - Navigating to profile URL:', profileUrl);
      navigate(profileUrl);
    } else {
      console.log('Header - No user ID available for profile navigation');
      navigate('/login');
    }
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  const handleDashboardClick = () => {
    navigate('/home');
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuOpen}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <IconButton color="inherit" onClick={handleHomeClick}>
          <HomeIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}
        >
          SportFwd
        </Typography>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search athletes, teams, events..."
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <IconButton 
            color="inherit"
            onClick={handleNotificationsClick}
          >
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton 
            size="large" 
            color="inherit"
            onClick={handleMessagesClick}
          >
            <UnreadMessagesBadge />
          </IconButton>
          <IconButton
            edge="end"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {user?.photoURL ? (
              <Avatar 
                src={user.photoURL}
                alt={user?.displayName || 'User'}
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s'
                  }
                }}
                imgProps={{
                  onError: (e) => {
                    const imgElement = e.target as HTMLImageElement;
                    imgElement.style.display = 'none';
                  }
                }}
              >
                {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            ) : (
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s'
                  }
                }}
              >
                {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            )}
          </IconButton>
        </Box>
      </Toolbar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        PaperProps={{
          sx: {
            mt: 1,
            width: 360,
            maxHeight: 400,
            overflowY: 'auto',
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
        </Box>
        <Divider />
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Loading...</Typography>
          </Box>
        ) : notifications.length > 0 ? (
          <List>
            {notifications.map((notification) => (
              <ListItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar src={notification.sender?.photoURL || undefined}>
                    {notification.sender?.displayName?.[0]}
                  </Avatar>
                </ListItemAvatar>
                {renderNotificationContent(notification)}
              </ListItem>
            ))}
          </List>
        ) : (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography color="textSecondary">
              No notifications
            </Typography>
          </Box>
        )}
      </Menu>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          {user?.photoURL ? (
            <Avatar 
              src={user.photoURL}
              sx={{
                width: 32,
                height: 32,
                mr: 2,
                border: '2px solid',
                borderColor: 'background.paper'
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: 2,
                bgcolor: 'primary.main',
                border: '2px solid',
                borderColor: 'background.paper'
              }}
            >
              {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
            </Avatar>
          )}
          Profile
        </MenuItem>
        <MenuItem onClick={handleDashboardClick}>
          <HomeIcon sx={{ mr: 2 }} />
          Dashboard
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <SettingsIcon sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchorEl}
        open={Boolean(mobileMenuAnchorEl)}
        onClose={() => setMobileMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {user?.photoURL ? (
              <Avatar 
                src={user.photoURL}
                sx={{
                  width: 32,
                  height: 32,
                  mr: 2,
                  border: '2px solid',
                  borderColor: 'background.paper'
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 2,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper'
                }}
              >
                {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            )}
            <Typography>Profile</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleDashboardClick}>
          <IconButton color="inherit">
            <HomeIcon />
          </IconButton>
          Dashboard
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
          Settings
        </MenuItem>
        <MenuItem>
          <IconButton color="inherit">
            <Badge badgeContent={unreadCount} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          Notifications
        </MenuItem>
        <MenuItem onClick={handleMessagesClick}>
          <IconButton color="inherit">
            <UnreadMessagesBadge />
          </IconButton>
          Messages
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header; 