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
  Chip,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Tab,
  Tabs,
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
  EmojiEvents,
  CalendarMonth,
  PhotoLibrary,
  Description,
} from '@mui/icons-material';
import { RootState } from '../store';
import type { User, SocialLinks } from '../types/user';
import Header from '../components/layout/Header';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ViewProfile = () => {
  const { userId } = useParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState(0);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch user data
    const fetchUserData = async () => {
      try {
        // Simulated API call
        const mockUser: User = {
          id: userId || '',
          uid: userId || '',
          email: 'athlete@example.com',
          displayName: 'John Doe',
          photoURL: undefined,
          userType: 'athlete',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          bio: 'Professional athlete with 5+ years of experience',
          location: 'New York, USA',
          verified: true,
          verificationStatus: 'none',
          privacySettings: {
            profileVisibility: 'public',
            allowMessagesFrom: 'everyone',
            showEmail: true,
            showLocation: true,
            showAcademicInfo: true,
            showAthleteStats: true
          },
          emailVerified: true,
          isAdmin: false,
          socialLinks: {
            instagram: '',
            twitter: '',
            linkedin: '',
            youtube: ''
          },
          followers: [],
          following: [],
          connections: []
        };

        setProfileData(mockUser);
        // Check if current user is connected
        setConnectionStatus(mockUser.connections.includes(currentUser?.id || '') ? 'connected' : 'none');
        // Check if current user is following
        setIsFollowing(mockUser.followers.includes(currentUser?.id || ''));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId, currentUser?.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleConnect = () => {
    setConnectionStatus('pending');
    // TODO: Implement connection request logic
  };

  const handleDisconnect = () => {
    setConnectionStatus('none');
    // TODO: Implement disconnect logic
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // TODO: Implement follow/unfollow logic
  };

  const handleMessage = () => {
    // TODO: Implement messaging logic
    console.log('Open message dialog');
  };

  if (loading || !profileData) {
    return (
      <Box>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
          <Typography>Loading profile...</Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        {/* Profile Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <Box>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  profileData.verified ? (
                    <Tooltip title="Verified Profile">
                      <Verified color="primary" />
                    </Tooltip>
                  ) : null
                }
              >
                <Avatar
                  sx={{ width: 120, height: 120 }}
                  src={profileData.photoURL || undefined}
                >
                  {profileData.displayName?.[0]}
                </Avatar>
              </Badge>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="h4" component="h1">
                  {profileData.displayName}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Chip
                  label={profileData.userType}
                  color="primary"
                  size="small"
                  sx={{ mr: 1 }}
                />
                {profileData.location && (
                  <Chip
                    icon={<LocationOn />}
                    label={profileData.location}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Box>
              <Box display="flex" gap={1}>
                {connectionStatus === 'none' && (
                  <Tooltip title="Send connection request">
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={handleConnect}
                    >
                      Connect
                    </Button>
                  </Tooltip>
                )}
                {connectionStatus === 'pending' && (
                  <Button
                    variant="outlined"
                    disabled
                  >
                    Request Pending
                  </Button>
                )}
                {connectionStatus === 'connected' && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<Message />}
                      onClick={handleMessage}
                    >
                      Message
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<PersonRemove />}
                      onClick={handleDisconnect}
                    >
                      Remove Connection
                    </Button>
                  </>
                )}
                <Button
                  variant={isFollowing ? "outlined" : "contained"}
                  onClick={handleFollow}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>

        {/* Profile Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab icon={<Description />} label="About" />
            <Tab icon={<PhotoLibrary />} label="Posts" />
            <Tab icon={<CalendarMonth />} label="Events" />
          </Tabs>
        </Box>

        {/* About Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Bio</Typography>
                <Typography>{profileData.bio}</Typography>
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Social Links</Typography>
                <List>
                  {profileData.socialLinks && Object.entries(profileData.socialLinks).map(([platform, url]) => (
                    url && (
                      <ListItem key={platform}>
                        <ListItemIcon>
                          {platform === 'instagram' && <Instagram />}
                          {platform === 'twitter' && <Twitter />}
                          {platform === 'linkedin' && <LinkedIn />}
                          {platform === 'youtube' && <YouTube />}
                        </ListItemIcon>
                        <ListItemText>
                          <a href={url.toString()} target="_blank" rel="noopener noreferrer">
                            {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          </a>
                        </ListItemText>
                      </ListItem>
                    )
                  ))}
                </List>
              </Paper>
            </Box>
            {profileData.userType === 'athlete' && (
              <Box sx={{ width: '100%' }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Statistics
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ width: { xs: '45%', md: '22%' } }}>
                      <Typography variant="subtitle2">Games Played</Typography>
                      <Typography variant="h4">24</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '45%', md: '22%' } }}>
                      <Typography variant="subtitle2">Goals</Typography>
                      <Typography variant="h4">12</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '45%', md: '22%' } }}>
                      <Typography variant="subtitle2">Assists</Typography>
                      <Typography variant="h4">8</Typography>
                    </Box>
                    <Box sx={{ width: { xs: '45%', md: '22%' } }}>
                      <Typography variant="subtitle2">Win Rate</Typography>
                      <Typography variant="h4">75%</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}
          </Box>
        </TabPanel>

        {/* Posts Tab */}
        <TabPanel value={activeTab} index={1}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {[1, 2, 3, 4].map((post) => (
              <Box key={post} sx={{ width: { xs: '100%', sm: '45%', md: '31%' } }}>
                <Card>
                  <CardMedia
                    component="img"
                    height="200"
                    image={`https://source.unsplash.com/random/400x400?sports&${post}`}
                    alt={`Post ${post}`}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary">
                      Post caption #{post}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </TabPanel>

        {/* Events Tab */}
        <TabPanel value={activeTab} index={2}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {[1, 2].map((event) => (
              <Box key={event} sx={{ width: { xs: '100%', md: '48%' } }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Event #{event}</Typography>
                    <Typography color="text.secondary">
                      📅 Upcoming Tournament
                    </Typography>
                    <Typography color="text.secondary">
                      📍 Main Stadium
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </TabPanel>
      </Container>
    </Box>
  );
};

export default ViewProfile; 