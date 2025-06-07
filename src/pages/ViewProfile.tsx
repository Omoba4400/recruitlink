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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
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
  Edit,
  Share,
  MoreHoriz,
} from '@mui/icons-material';
import { RootState } from '../store';
import type { User } from '../types/user';
import Header from '../components/layout/Header';

const ViewProfile = () => {
  const { userId } = useParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
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
          bio: 'Professional athlete with 5+ years of experience in competitive basketball. Currently playing for the New York Eagles. Specializing in point guard position with strong leadership skills and team coordination.',
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
            instagram: 'https://instagram.com/johndoe',
            twitter: 'https://twitter.com/johndoe',
            linkedin: 'https://linkedin.com/in/johndoe',
            youtube: 'https://youtube.com/johndoe'
          },
          followers: [],
          following: [],
          connections: []
        };

        setProfileData(mockUser);
        setConnectionStatus(mockUser.connections.includes(currentUser?.id || '') ? 'connected' : 'none');
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

  const handleConnect = () => {
    setConnectionStatus('pending');
  };

  const handleDisconnect = () => {
    setConnectionStatus('none');
  };

  const handleFollow = () => {
    setIsFollowing(!isFollowing);
  };

  const handleMessage = () => {
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
      <Container maxWidth="lg" sx={{ mt: 8 }}>
        {/* Profile Card */}
        <Paper sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
          {/* Banner Image */}
          <Box
            sx={{
              height: 200,
              bgcolor: 'primary.main',
              backgroundImage: 'url(https://source.unsplash.com/random/1600x400?sports)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative'
            }}
          />

          {/* Profile Info Section */}
          <Box sx={{ p: 3, position: 'relative' }}>
            {/* Profile Actions */}
            <Box sx={{ position: 'absolute', right: 24, top: -60, display: 'flex', gap: 1 }}>
              <IconButton sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}>
                <Share />
              </IconButton>
              <IconButton sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}>
                <Edit />
              </IconButton>
              <IconButton sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'background.default' } }}>
                <MoreHoriz />
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
              src={profileData.photoURL || undefined}
            >
              {profileData.displayName?.[0]}
            </Avatar>

            {/* Profile Header */}
            <Box sx={{ ml: '180px', mb: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="h4" component="h1">
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
              <Box display="flex" alignItems="center" gap={2} mb={1}>
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ mr: 0.5 }} color="action" />
                  <Typography color="text.secondary">{profileData.location}</Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Groups sx={{ mr: 0.5 }} color="action" />
                  <Typography color="text.secondary">500+ connections</Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box display="flex" gap={1} mt={2}>
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
                    sx={{ borderRadius: 2 }}
                  >
                    Pending
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
                <Button
                  variant={isFollowing ? "outlined" : "contained"}
                  onClick={handleFollow}
                  sx={{ borderRadius: 2 }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
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
              <Typography color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {profileData.bio}
              </Typography>
            </Paper>

            {/* Experience Section */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <Work sx={{ mr: 1 }} /> Experience
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 48, height: 48 }}>NE</Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="Point Guard"
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          New York Eagles
                        </Typography>
                        <br />
                        <Typography variant="body2" color="text.secondary">
                          2020 - Present · 3 yrs
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </List>
            </Paper>

            {/* Education Section */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ mr: 1 }} /> Education
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Avatar sx={{ width: 48, height: 48 }}>NU</Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary="New York University"
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          Bachelor's Degree in Sports Management
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          2016 - 2020
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Right Column */}
          <Grid item xs={12} md={4}>
            {/* Stats Card */}
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <EmojiEvents sx={{ mr: 1 }} /> Career Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">24</Typography>
                  <Typography variant="body2" color="text.secondary">Games Played</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">12</Typography>
                  <Typography variant="body2" color="text.secondary">Goals</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">8</Typography>
                  <Typography variant="body2" color="text.secondary">Assists</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="primary">75%</Typography>
                  <Typography variant="body2" color="text.secondary">Win Rate</Typography>
                </Grid>
              </Grid>
            </Paper>

            {/* Social Links */}
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>Social Media</Typography>
              <List>
                {profileData.socialLinks && Object.entries(profileData.socialLinks).map(([platform, url]) => (
                  url && (
                    <ListItem key={platform} sx={{ px: 0 }}>
                      <ListItemIcon>
                        {platform === 'instagram' && <Instagram color="action" />}
                        {platform === 'twitter' && <Twitter color="action" />}
                        {platform === 'linkedin' && <LinkedIn color="action" />}
                        {platform === 'youtube' && <YouTube color="action" />}
                      </ListItemIcon>
                      <ListItemText>
                        <a 
                          href={url.toString()} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </a>
                      </ListItemText>
                    </ListItem>
                  )
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default ViewProfile; 