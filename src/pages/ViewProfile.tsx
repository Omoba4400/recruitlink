import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Grid,
  Skeleton,
  Divider,
  Card,
  CardContent,
  Link,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Verified,
  LocationOn,
  Message,
  Add,
  PersonRemove,
  Instagram,
  Twitter,
  LinkedIn,
  YouTube,
  School,
  Work,
  EmojiEvents,
  Groups,
  Share,
  MoreVert,
  Edit,
  PersonAdd,
  PersonAddDisabled,
  HourglassEmpty,
  People,
} from '@mui/icons-material';
import { RootState } from '../store';
import type { User, ConnectionRequest } from '../types/user';
import Header from '../components/layout/Header';
import { 
  getUserProfile,
  sendConnectionRequest,
  getConnectionRequests,
  disconnectFromUser,
  followUser,
  unfollowUser,
  removeFollower,
} from '../services/user.service';
import { useSnackbar } from 'notistack';

const ViewProfile = () => {
  const { userId } = useParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [followStatus, setFollowStatus] = useState<'following' | 'not_following'>('not_following');
  const { enqueueSnackbar } = useSnackbar();
  const [followersMenuAnchor, setFollowersMenuAnchor] = useState<null | HTMLElement>(null);
  const [followers, setFollowers] = useState<User[]>([]);
  const [loadingFollowers, setLoadingFollowers] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !currentUser?.id) return;
      
      try {
        setLoading(true);
        const [userData, connectionRequests] = await Promise.all([
          getUserProfile(userId),
          getConnectionRequests(currentUser.id)
        ]);

        if (userData) {
          const userWithAuth: User = {
            ...userData,
            id: userData.uid,
            emailVerified: false,
            lastLogin: userData.updatedAt,
            isAdmin: false,
            blockedUsers: [],
            messageThreads: []
          };
          setProfileData(userWithAuth);
          
          // Check connection status
          if (currentUser.connections?.includes(userId)) {
            setConnectionStatus('connected');
          } else {
            // Check if there's a pending request
            const pendingRequest = connectionRequests.find(
              req => (req.senderId === currentUser.id && req.receiverId === userId) ||
                    (req.senderId === userId && req.receiverId === currentUser.id)
            );
            setConnectionStatus(pendingRequest ? 'pending' : 'none');
          }

          // Check follow status
          if (currentUser.following?.includes(userId)) {
            setFollowStatus('following');
          } else {
            setFollowStatus('not_following');
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        enqueueSnackbar('Failed to load profile data', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId, currentUser?.id, currentUser?.connections, currentUser?.following, enqueueSnackbar]);

  useEffect(() => {
    const fetchFollowers = async () => {
      if (!profileData?.followers?.length) return;
      
      try {
        setLoadingFollowers(true);
        const followerProfiles = await Promise.all(
          profileData.followers.map(id => getUserProfile(id))
        );
        setFollowers(followerProfiles.filter((f): f is User => f !== null));
      } catch (error) {
        console.error('Error fetching followers:', error);
      } finally {
        setLoadingFollowers(false);
      }
    };

    fetchFollowers();
  }, [profileData?.followers]);

  const handleConnect = async () => {
    if (!currentUser?.id || !userId) return;
    
    try {
      await sendConnectionRequest(currentUser.id, userId);
      setConnectionStatus('pending');
      enqueueSnackbar('Connection request sent', { variant: 'success' });
    } catch (error) {
      console.error('Error sending connection request:', error);
      enqueueSnackbar('Failed to send connection request', { variant: 'error' });
    }
  };

  const handleDisconnect = async () => {
    if (!currentUser?.id || !userId) return;
    
    try {
      await disconnectFromUser(currentUser.id, userId);
      setConnectionStatus('none');
      enqueueSnackbar('Connection removed', { variant: 'success' });
    } catch (error) {
      console.error('Error disconnecting from user:', error);
      enqueueSnackbar('Failed to remove connection', { variant: 'error' });
    }
  };

  const handleFollow = async () => {
    if (!currentUser?.id || !userId) return;
    
    try {
      await followUser(currentUser.id, userId);
      setFollowStatus('following');
      enqueueSnackbar('Now following user', { variant: 'success' });
    } catch (error) {
      console.error('Error following user:', error);
      enqueueSnackbar('Failed to follow user', { variant: 'error' });
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser?.id || !userId) return;
    
    try {
      await unfollowUser(currentUser.id, userId);
      setFollowStatus('not_following');
      enqueueSnackbar('Unfollowed user', { variant: 'success' });
    } catch (error) {
      console.error('Error unfollowing user:', error);
      enqueueSnackbar('Failed to unfollow user', { variant: 'error' });
    }
  };

  const handleMessage = () => {
    // TODO: Implement messaging
    enqueueSnackbar('Messaging feature coming soon', { variant: 'info' });
  };

  const handleShare = () => {
    // TODO: Implement profile sharing
    enqueueSnackbar('Share feature coming soon', { variant: 'info' });
  };

  const handleRemoveFollower = async (followerId: string) => {
    if (!currentUser?.id) return;
    
    try {
      await removeFollower(currentUser.id, followerId);
      setFollowers(prev => prev.filter(f => f.id !== followerId));
      enqueueSnackbar('Follower removed', { variant: 'success' });
    } catch (error) {
      console.error('Error removing follower:', error);
      enqueueSnackbar('Failed to remove follower', { variant: 'error' });
    }
  };

  const handleFollowersClick = (event: React.MouseEvent<HTMLElement>) => {
    setFollowersMenuAnchor(event.currentTarget);
  };

  const handleFollowersClose = () => {
    setFollowersMenuAnchor(null);
  };

  const renderProfileSkeleton = () => (
    <Box>
      <Skeleton variant="rectangular" height={200} />
      <Box sx={{ p: 3 }}>
        <Skeleton variant="circular" width={150} height={150} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={40} width="60%" />
        <Skeleton variant="text" height={30} width="40%" />
        <Skeleton variant="text" height={24} width="30%" />
      </Box>
    </Box>
  );

  const renderActionButtons = () => {
    if (currentUser?.id === profileData?.id) {
      return (
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            sx={{ borderRadius: 2 }}
          >
            Edit Profile
          </Button>
          <Button
            variant="outlined"
            startIcon={<People />}
            onClick={handleFollowersClick}
            sx={{ borderRadius: 2 }}
          >
            Followers ({profileData?.followers?.length || 0})
          </Button>
        </Box>
      );
    }

    return (
      <Box display="flex" gap={1}>
        {/* Follow/Unfollow Button */}
        {followStatus === 'not_following' ? (
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={handleFollow}
            sx={{ borderRadius: 2 }}
          >
            Follow
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="error"
            startIcon={<PersonAddDisabled />}
            onClick={handleUnfollow}
            sx={{ borderRadius: 2 }}
          >
            Unfollow
          </Button>
        )}

        {/* Connect/Disconnect Button */}
        {connectionStatus === 'none' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleConnect}
            sx={{ borderRadius: 2 }}
          >
            Connect
          </Button>
        )}
        {connectionStatus === 'pending' && (
          <Button
            variant="outlined"
            disabled
            startIcon={<HourglassEmpty />}
            sx={{ borderRadius: 2 }}
          >
            Request Pending
          </Button>
        )}
        {connectionStatus === 'connected' && (
          <>
            <Button
              variant="contained"
              startIcon={<Message />}
              onClick={handleMessage}
              sx={{ borderRadius: 2 }}
            >
              Message
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<PersonRemove />}
              onClick={handleDisconnect}
              sx={{ borderRadius: 2 }}
            >
              Remove
            </Button>
          </>
        )}
      </Box>
    );
  };

  if (loading) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
          {renderProfileSkeleton()}
        </Container>
      </Box>
    );
  }

  if (!profileData) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
          <Typography variant="h5" align="center">Profile not found</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 8, mb: 4 }}>
        {/* Profile Header Card */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          {/* Banner */}
          <Box
            sx={{
              height: 200,
              bgcolor: 'primary.main',
              position: 'relative'
            }}
          />

          {/* Profile Info */}
          <Box sx={{ p: 3, position: 'relative' }}>
            {/* Action Buttons */}
            <Box sx={{ position: 'absolute', right: 24, top: -28, display: 'flex', gap: 1 }}>
              <IconButton 
                sx={{ bgcolor: 'background.paper' }}
                onClick={handleShare}
              >
                <Share />
              </IconButton>
              <IconButton sx={{ bgcolor: 'background.paper' }}>
                <MoreVert />
              </IconButton>
            </Box>

            {/* Avatar */}
            <Avatar
              sx={{
                width: 150,
                height: 150,
                border: 4,
                borderColor: 'background.paper',
                position: 'absolute',
                top: -75,
                left: 24
              }}
              src={profileData.photoURL}
            >
              {profileData.displayName?.[0]}
            </Avatar>

            {/* Profile Info */}
            <Box sx={{ ml: '180px' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h4">
                  {profileData.displayName}
                </Typography>
                {profileData.verified && (
                  <Tooltip title="Verified Profile">
                    <Verified color="primary" />
                  </Tooltip>
                )}
              </Box>

              <Typography variant="h6" color="text.secondary" gutterBottom>
                {profileData.userType.charAt(0).toUpperCase() + profileData.userType.slice(1)}
              </Typography>

              <Box display="flex" alignItems="center" gap={2} mb={2}>
                {profileData.location && (
                  <Box display="flex" alignItems="center">
                    <LocationOn sx={{ mr: 0.5 }} color="action" />
                    <Typography color="text.secondary">
                      {profileData.location}
                    </Typography>
                  </Box>
                )}
                <Box display="flex" alignItems="center">
                  <Groups sx={{ mr: 0.5 }} color="action" />
                  <Typography color="text.secondary">
                    {profileData.connections?.length || 0} connections
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box display="flex" gap={1}>
                {renderActionButtons()}
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Left Column */}
          <Grid item xs={12} md={8}>
            {/* About Section */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>About</Typography>
              <Typography color="text.secondary">
                {profileData.bio || 'No bio available'}
              </Typography>
            </Paper>

            {/* Experience Section */}
            {profileData.userType === 'athlete' && profileData.athleteInfo && (
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <Work sx={{ mr: 1 }} /> Athletic Experience
                </Typography>
                <List>
                  {profileData.athleteInfo.sports.map((sport, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={sport.sport}
                        secondary={`${sport.position} • ${sport.level} • ${sport.experience} years experience`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Education Section */}
            {profileData.userType === 'athlete' && profileData.athleteInfo?.academicInfo && (
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <School sx={{ mr: 1 }} /> Education
                </Typography>
                <Typography variant="body1">
                  {profileData.athleteInfo.academicInfo.currentSchool}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expected Graduation: {profileData.athleteInfo.academicInfo.graduationYear}
                </Typography>
              </Paper>
            )}
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Stats Card */}
            {profileData.userType === 'athlete' && (
              <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmojiEvents sx={{ mr: 1 }} /> Achievements
                </Typography>
                <List dense>
                  {profileData.athleteInfo?.achievements.map((achievement, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={achievement} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            {/* Social Links */}
            {profileData.socialLinks && Object.keys(profileData.socialLinks).length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>Social Media</Typography>
                <List>
                  {Object.entries(profileData.socialLinks).map(([platform, url]) => (
                    url && (
                      <ListItem key={platform} component={Link} href={url} target="_blank" sx={{ color: 'inherit' }}>
                        <ListItemIcon>
                          {platform === 'instagram' && <Instagram />}
                          {platform === 'twitter' && <Twitter />}
                          {platform === 'linkedin' && <LinkedIn />}
                          {platform === 'youtube' && <YouTube />}
                        </ListItemIcon>
                        <ListItemText primary={platform.charAt(0).toUpperCase() + platform.slice(1)} />
                      </ListItem>
                    )
                  ))}
                </List>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Followers Menu */}
        <Menu
          anchorEl={followersMenuAnchor}
          open={Boolean(followersMenuAnchor)}
          onClose={handleFollowersClose}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 400,
            },
          }}
        >
          <Box p={2}>
            <Typography variant="h6" gutterBottom>
              Followers
            </Typography>
          </Box>
          <Divider />
          {loadingFollowers ? (
            <Box p={2} display="flex" justifyContent="center">
              <CircularProgress size={24} />
            </Box>
          ) : followers.length > 0 ? (
            <List>
              {followers.map((follower) => (
                <ListItem
                  key={follower.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      color="error"
                      onClick={() => handleRemoveFollower(follower.id)}
                    >
                      <PersonRemove />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={follower.photoURL || undefined}>
                      {follower.displayName?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={follower.displayName}
                    secondary={follower.userType}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={2}>
              <Typography color="textSecondary" align="center">
                No followers yet
              </Typography>
            </Box>
          )}
        </Menu>
      </Container>
    </Box>
  );
};

export default ViewProfile; 