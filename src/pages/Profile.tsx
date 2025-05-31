import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  Chip,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardMedia,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Link,
  Badge,
  TextField,
  LinearProgress,
  ListItemAvatar,
  CardActions,
  CircularProgress,
} from '@mui/material';
import {
  LocationOn,
  Verified,
  Message,
  Add,
  Check,
  Close,
  Link as LinkIcon,
  EmojiEvents,
  TrendingUp,
  Event,
  Image,
  VideoLibrary,
  Edit as EditIcon,
  Save as SaveIcon,
  Instagram,
  Twitter,
  LinkedIn,
  YouTube,
  PersonRemove,
  Share,
  BookmarkBorder,
  Description,
  CalendarMonth,
  Group,
  Business,
  Settings,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { User } from '../types/user';
import Header from '../components/layout/Header';
import { Link as RouterLink } from 'react-router-dom';
import { uploadToCloudinary } from '../config/cloudinary';
import { getUserProfile } from '../services/user.service';
import { useSnackbar } from 'notistack';

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

interface SocialLink {
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
}

// Add interface for user data
interface UserData {
  id: string;
  name: string;
  role: string;
  location: string;
  sport: string;
  team?: string;
  isVerified: boolean;
  bio: string;
  stats: {
    [key: string]: number;
  };
  socialLinks: SocialLink;
}

// Mock user database - replace with actual API calls
const mockUsers: Record<string, UserData> = {
  'user1': {
    id: 'user1',
    name: 'John Smith',
    role: 'Athlete',
    location: 'New York, USA',
    sport: 'Basketball',
    team: 'Team Thunder',
    isVerified: true,
    bio: 'Professional basketball player with 5 years of experience. Passionate about the game and helping young athletes develop their skills.',
    stats: {
      gamesPlayed: 156,
      wins: 98,
      performance: 85,
    },
    socialLinks: {
      instagram: 'https://instagram.com/johnsmith',
      twitter: 'https://twitter.com/johnsmith',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      youtube: 'https://youtube.com/johnsmith',
    },
  },
  'user2': {
    id: 'user2',
    name: 'Sarah Johnson',
    role: 'Coach',
    location: 'Los Angeles, USA',
    sport: 'Basketball',
    team: 'LA Lakers',
    isVerified: true,
    bio: 'Professional basketball coach with 10 years of experience. Specialized in player development and team strategy.',
    stats: {
      teamsCoached: 5,
      championships: 3,
      winRate: 75,
    },
    socialLinks: {
      instagram: 'https://instagram.com/sarahjohnson',
      twitter: 'https://twitter.com/sarahjohnson',
      linkedin: 'https://linkedin.com/in/sarahjohnson',
      youtube: 'https://youtube.com/sarahjohnson',
    },
  },
  'user3': {
    id: 'user3',
    name: 'Team Thunder',
    role: 'Team',
    location: 'Chicago, USA',
    sport: 'Basketball',
    isVerified: true,
    bio: 'Professional basketball team competing in the National League. Home to some of the best players in the country.',
    stats: {
      seasonWins: 42,
      championships: 2,
      ranking: 3,
    },
    socialLinks: {
      instagram: 'https://instagram.com/teamthunder',
      twitter: 'https://twitter.com/teamthunder',
      linkedin: 'https://linkedin.com/in/teamthunder',
      youtube: 'https://youtube.com/teamthunder',
    },
  },
};

const mockPosts = [
  {
    id: 1,
    type: 'image',
    media: 'https://placekitten.com/300/300',
    caption: 'Great game today! 🏆',
    likes: 120,
    comments: 15,
    date: '2024-03-15',
  },
  // Add more mock posts
];

const mockEvents = [
  {
    id: 1,
    title: 'Summer Training Camp',
    date: '2024-06-15',
    location: 'Main Stadium',
    attendees: 45,
    isCreator: true,
  },
  // Add more mock events
];

const mockConnections = [
  {
    id: 1,
    name: 'John Smith',
    role: 'Athlete',
    avatar: 'JS',
    isVerified: true,
  },
  // Add more mock connections
];

const mockAthleteStats = {
  gamesPlayed: 24,
  goals: 15,
  assists: 10,
  points: 25,
  monthlyProgress: [
    { month: 'Jan', value: 75 },
    { month: 'Feb', value: 82 },
    { month: 'Mar', value: 88 },
  ],
};

const Profile = () => {
  const { userId } = useParams();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();

  console.log('Profile render - userId:', userId);
  console.log('Profile render - currentUser:', currentUser);

  const [profileData, setProfileData] = useState<User | null>(() => {
    console.log('Initializing profileData with currentUser:', currentUser);
    return currentUser;
  });

  useEffect(() => {
    console.log('Profile useEffect - userId:', userId);
    console.log('Profile useEffect - currentUser:', currentUser);
    console.log('Profile useEffect - profileData:', profileData);

    const fetchProfileData = async () => {
      // If we're viewing our own profile
      if (!userId) {
        if (currentUser) {
          console.log('Setting profile data to currentUser:', currentUser);
          setProfileData(currentUser);
          setLoading(false);
        } else {
          console.log('No currentUser available');
          setError('User not authenticated');
          setLoading(false);
        }
        return;
      }

      // If we're viewing someone else's profile
      try {
        console.log('Fetching profile for userId:', userId);
        setLoading(true);
        setError(null);

        const userData = await getUserProfile(userId);
        
        if (!userData) {
          throw new Error('User not found');
        }

        console.log('Fetched user data:', userData);
        setProfileData(userData);
      } catch (err: any) {
        console.error('Error fetching profile:', err);
        setError(err.message || 'Failed to load profile');
        enqueueSnackbar(err.message || 'Failed to load profile', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, currentUser, enqueueSnackbar]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!profileData) return;

    try {
      setLoading(true);
      // TODO: Implement API call to save profile data
      setIsEditing(false);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error saving profile:', error);
      enqueueSnackbar('Failed to save profile. Please try again.', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLinkChange = (platform: keyof User['socialLinks'], value: string) => {
    if (!profileData) return;

    setProfileData({
      ...profileData,
      socialLinks: {
        ...profileData.socialLinks,
        [platform]: value,
      },
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' = 'image') => {
    if (!profileData) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, type);
      if (type === 'image') {
        // Update profile picture
        setProfileData({
          ...profileData,
          photoURL: url,
        });
        // TODO: Update user profile in backend/firebase
      } else {
        // Handle video upload for athlete highlights
        const videos = profileData.videos || [];
        setProfileData({
          ...profileData,
          videos: [...videos, url],
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
      enqueueSnackbar('Failed to upload file. Please try again.', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const renderSocialLinks = () => {
    if (!profileData?.socialLinks) return null;

    return Object.entries(profileData.socialLinks).map(([platform, url]) => (
      <ListItem key={platform}>
        <ListItemAvatar>
          <Avatar>
            {platform === 'instagram' && <Instagram />}
            {platform === 'twitter' && <Twitter />}
            {platform === 'linkedin' && <LinkedIn />}
            {platform === 'youtube' && <YouTube />}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={platform.charAt(0).toUpperCase() + platform.slice(1)}
          secondary={isEditing ? (
            <TextField
              fullWidth
              size="small"
              value={url || ''}
              onChange={(e) => handleSocialLinkChange(platform as keyof User['socialLinks'], e.target.value)}
            />
          ) : url || 'Not linked'}
        />
      </ListItem>
    ));
  };

  const renderProfilePictureUpload = () => {
    if (!profileData) return null;

    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        badgeContent={
          <IconButton
            size="small"
            sx={{ bgcolor: 'background.paper' }}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <CircularProgress size={24} />
            ) : (
              <EditIcon fontSize="small" />
            )}
          </IconButton>
        }
      >
        <Avatar
          sx={{ width: 120, height: 120 }}
          src={profileData.photoURL || undefined}
        >
          {profileData.displayName?.[0]}
        </Avatar>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'image')}
        />
      </Badge>
    );
  };

  const renderVideoUpload = () => {
    if (!profileData) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Highlights / Videos</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {(profileData.videos || []).map((videoUrl: string, index: number) => (
            <Box key={index} sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }}>
              <Card>
                <CardMedia
                  component="video"
                  controls
                  src={videoUrl}
                  sx={{ height: 200 }}
                />
                {isEditing && (
                  <CardActions>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        const videos = [...(profileData.videos || [])];
                        videos.splice(index, 1);
                        setProfileData({
                          ...profileData,
                          videos,
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Box>
          ))}
          {isEditing && (profileData.videos || []).length < 5 && (
            <Box sx={{ width: { xs: '100%', sm: '45%', md: '30%' } }}>
              <Card
                sx={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  bgcolor: 'action.hover',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <VideoLibrary fontSize="large" />
                  <Typography>Add Video</Typography>
                </Box>
              </Card>
            </Box>
          )}
        </Box>
      </Box>
    );
  };

  if (loading) {
    console.log('Showing loading state');
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              gap: 2,
            }}
          >
            <CircularProgress size={40} />
            <Typography variant="h6" color="textSecondary">
              Loading profile...
            </Typography>
          </Box>
        </Container>
      </>
    );
  }

  if (error || !profileData) {
    console.log('Showing error state - error:', error);
    console.log('Showing error state - profileData:', profileData);
    return (
      <>
        <Header />
        <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '50vh',
              gap: 2,
            }}
          >
            <Typography variant="h6" color="error">
              {error || 'Profile not found'}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/home')}
            >
              Return to Home
            </Button>
          </Box>
        </Container>
      </>
    );
  }

  console.log('Rendering profile with data:', profileData);

  // Don't show connect/follow buttons if viewing own profile
  const isOwnProfile = currentUser?.uid === userId;

  const renderOverviewTab = () => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
      {/* Bio Section */}
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">About</Typography>
            {!isEditing ? (
              <IconButton onClick={handleEditToggle}>
                <EditIcon />
              </IconButton>
            ) : (
              <IconButton onClick={handleSaveProfile} color="primary">
                <SaveIcon />
              </IconButton>
            )}
          </Box>
          {isEditing ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              value={profileData.bio || ''}
              onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
              placeholder="Tell us about yourself..."
            />
          ) : (
            <Typography>{profileData.bio || 'No bio added yet.'}</Typography>
          )}
        </Paper>
      </Box>

      {/* Role-Specific Details Section */}
      <Box sx={{ width: { xs: '100%', md: '48%' } }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Details</Typography>
          {profileData.userType === 'athlete' && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Sport & Position"
                  secondary={isEditing ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        value={profileData.sport || ''}
                        onChange={(e) => setProfileData({ ...profileData, sport: e.target.value })}
                        placeholder="Sport"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        value={profileData.position || ''}
                        onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
                        placeholder="Position"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  ) : `${profileData.sport || 'Not specified'} - ${profileData.position || 'Not specified'}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Current Team"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.team || ''}
                      onChange={(e) => setProfileData({ ...profileData, team: e.target.value })}
                    />
                  ) : profileData.team || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Age / DOB"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      type="date"
                      value={profileData.dateOfBirth || ''}
                      onChange={(e) => setProfileData({ ...profileData, dateOfBirth: e.target.value })}
                    />
                  ) : profileData.dateOfBirth || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Height / Weight"
                  secondary={isEditing ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        value={profileData.height || ''}
                        onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
                        placeholder="Height"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        value={profileData.weight || ''}
                        onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
                        placeholder="Weight"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  ) : `${profileData.height || 'Not specified'} / ${profileData.weight || 'Not specified'}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Playing Experience"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.experience || ''}
                      onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                      placeholder="Years of experience, clubs/teams played for"
                    />
                  ) : profileData.experience || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Career Stats"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={profileData.careerStats || ''}
                      onChange={(e) => setProfileData({ ...profileData, careerStats: e.target.value })}
                      placeholder="Matches played, goals, assists, etc."
                    />
                  ) : profileData.careerStats || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Awards & Achievements"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.awards || ''}
                      onChange={(e) => setProfileData({ ...profileData, awards: e.target.value })}
                      placeholder="MVP, Top Scorer, State Champion, etc."
                    />
                  ) : profileData.awards || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Training Schedule"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.trainingSchedule || ''}
                      onChange={(e) => setProfileData({ ...profileData, trainingSchedule: e.target.value })}
                      placeholder="Daily routine or upcoming events"
                    />
                  ) : profileData.trainingSchedule || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Availability"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      value={profileData.availability || ''}
                      onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })}
                      placeholder="For recruitment, trials, events, or sponsorship"
                    />
                  ) : profileData.availability || 'Not specified'}
                />
              </ListItem>
            </List>
          )}

          {profileData.userType === 'coach' && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Sport & Focus"
                  secondary={isEditing ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small"
                        value={profileData.sport || ''}
                        onChange={(e) => setProfileData({ ...profileData, sport: e.target.value })}
                        placeholder="Sport"
                        sx={{ flex: 1 }}
                      />
                      <TextField
                        size="small"
                        value={profileData.focus || ''}
                        onChange={(e) => setProfileData({ ...profileData, focus: e.target.value })}
                        placeholder="Focus Area"
                        sx={{ flex: 1 }}
                      />
                    </Box>
                  ) : `${profileData.sport || 'Not specified'} - ${profileData.focus || 'Not specified'}`}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Current Team / School"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.team || ''}
                      onChange={(e) => setProfileData({ ...profileData, team: e.target.value })}
                    />
                  ) : profileData.team || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Coaching Experience"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.experience || ''}
                      onChange={(e) => setProfileData({ ...profileData, experience: e.target.value })}
                      placeholder="Years of coaching + past teams"
                    />
                  ) : profileData.experience || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Certifications"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.certifications || ''}
                      onChange={(e) => setProfileData({ ...profileData, certifications: e.target.value })}
                      placeholder="Coaching licenses, certifications"
                    />
                  ) : profileData.certifications || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Past Achievements"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.achievements || ''}
                      onChange={(e) => setProfileData({ ...profileData, achievements: e.target.value })}
                      placeholder="Titles won, athletes scouted, tournaments led"
                    />
                  ) : profileData.achievements || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Training Philosophy"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={profileData.philosophy || ''}
                      onChange={(e) => setProfileData({ ...profileData, philosophy: e.target.value })}
                      placeholder="Your coaching style and approach"
                    />
                  ) : profileData.philosophy || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Availability for Events"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      value={profileData.availability || ''}
                      onChange={(e) => setProfileData({ ...profileData, availability: e.target.value })}
                      placeholder="Whether open to coaching camps, events, etc."
                    />
                  ) : profileData.availability || 'Not specified'}
                />
              </ListItem>
            </List>
          )}

          {profileData.userType === 'team' && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Sport"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.sport || ''}
                      onChange={(e) => setProfileData({ ...profileData, sport: e.target.value })}
                    />
                  ) : profileData.sport || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Affiliation"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.affiliation || ''}
                      onChange={(e) => setProfileData({ ...profileData, affiliation: e.target.value })}
                      placeholder="High School, College, Club, Academy"
                    />
                  ) : profileData.affiliation || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Team Roster"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={profileData.roster || ''}
                      onChange={(e) => setProfileData({ ...profileData, roster: e.target.value })}
                      placeholder="List of athletes & coaches"
                    />
                  ) : profileData.roster || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Recent Matches / Events"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={profileData.recentMatches || ''}
                      onChange={(e) => setProfileData({ ...profileData, recentMatches: e.target.value })}
                      placeholder="List of recent activities"
                    />
                  ) : profileData.recentMatches || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Win/Loss Record"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.record || ''}
                      onChange={(e) => setProfileData({ ...profileData, record: e.target.value })}
                      placeholder="Season stats or achievements"
                    />
                  ) : profileData.record || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Recruiting Status"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.recruitingStatus || ''}
                      onChange={(e) => setProfileData({ ...profileData, recruitingStatus: e.target.value })}
                      placeholder="Actively Looking for Players or Closed"
                    />
                  ) : profileData.recruitingStatus || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Upcoming Tryouts"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.upcomingTryouts || ''}
                      onChange={(e) => setProfileData({ ...profileData, upcomingTryouts: e.target.value })}
                      placeholder="Event cards or schedule"
                    />
                  ) : profileData.upcomingTryouts || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Contact Info"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.contactInfo || ''}
                      onChange={(e) => setProfileData({ ...profileData, contactInfo: e.target.value })}
                      placeholder="Email or direct contact for team admins"
                    />
                  ) : profileData.contactInfo || 'Not specified'}
                />
              </ListItem>
            </List>
          )}

          {profileData.userType === 'company' && (
            <List>
              <ListItem>
                <ListItemText
                  primary="Industry"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.industry || ''}
                      onChange={(e) => setProfileData({ ...profileData, industry: e.target.value })}
                      placeholder="Sportswear, Nutrition, Athlete Branding"
                    />
                  ) : profileData.industry || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Company Bio"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={profileData.companyBio || ''}
                      onChange={(e) => setProfileData({ ...profileData, companyBio: e.target.value })}
                      placeholder="Short intro to your brand"
                    />
                  ) : profileData.companyBio || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Sponsorship Programs"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={3}
                      value={profileData.sponsorshipPrograms || ''}
                      onChange={(e) => setProfileData({ ...profileData, sponsorshipPrograms: e.target.value })}
                      placeholder="What types of athletes or teams you support"
                    />
                  ) : profileData.sponsorshipPrograms || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Active Campaigns"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.activeCampaigns || ''}
                      onChange={(e) => setProfileData({ ...profileData, activeCampaigns: e.target.value })}
                      placeholder="Links to current or past sponsored events"
                    />
                  ) : profileData.activeCampaigns || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Contact Info"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      value={profileData.contactInfo || ''}
                      onChange={(e) => setProfileData({ ...profileData, contactInfo: e.target.value })}
                      placeholder="Business email, link to apply for sponsorship"
                    />
                  ) : profileData.contactInfo || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Collaborations"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.collaborations || ''}
                      onChange={(e) => setProfileData({ ...profileData, collaborations: e.target.value })}
                      placeholder="List of athletes/teams you've worked with"
                    />
                  ) : profileData.collaborations || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Social Proof"
                  secondary={isEditing ? (
                    <TextField
                      fullWidth
                      size="small"
                      multiline
                      rows={2}
                      value={profileData.socialProof || ''}
                      onChange={(e) => setProfileData({ ...profileData, socialProof: e.target.value })}
                      placeholder="Logos, video promos, partner badges"
                    />
                  ) : profileData.socialProof || 'Not specified'}
                />
              </ListItem>
            </List>
          )}
        </Paper>
      </Box>

      {/* Social Links Section */}
      <Box sx={{ width: { xs: '100%', md: '48%' } }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Social Media</Typography>
          <List>
            {renderSocialLinks()}
          </List>
        </Paper>
      </Box>

      {/* Verification Status */}
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Verified color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Verification Status</Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              startIcon={<Verified />}
            >
              Request Verification
            </Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );

  const renderPostsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">My Posts</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
        >
          New Post
        </Button>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {mockPosts.map((post) => (
          <Box key={post.id} sx={{ width: { xs: '100%', sm: '45%' } }}>
            <Card>
              <CardMedia
                component="img"
                height="200"
                image={post.media}
                alt={post.caption}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  {post.caption}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ❤️ {post.likes} 💬 {post.comments}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderEventsTab = () => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Events</Typography>
        {profileData.userType !== 'athlete' && (
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            Create Event
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {mockEvents.map((event) => (
          <Box key={event.id} sx={{ width: { xs: '100%', md: '48%' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6">{event.title}</Typography>
                <Typography color="textSecondary">
                  📅 {event.date}
                </Typography>
                <Typography color="textSecondary">
                  📍 {event.location}
                </Typography>
                <Typography color="textSecondary">
                  👥 {event.attendees} attendees
                </Typography>
                <Box mt={2}>
                  <Button variant="outlined" size="small">
                    View Details
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const renderConnectionsTab = () => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: '31%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Connected</Typography>
            <List>
              {mockConnections.map((connection) => (
                <ListItem key={connection.id}>
                  <ListItemIcon>
                    <Avatar>{connection.avatar}</Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Link
                          component={RouterLink}
                          to={`/view-profile/${connection.id}`}
                          sx={{ textDecoration: 'none', color: 'inherit' }}
                        >
                          {connection.name}
                        </Link>
                        {connection.isVerified && (
                          <Verified color="primary" sx={{ ml: 1, fontSize: 16 }} />
                        )}
                      </Box>
                    }
                    secondary={connection.role}
                  />
                  <IconButton size="small">
                    <Message />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <PersonRemove />
                  </IconButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
        <Box sx={{ width: { xs: '100%', md: '31%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Followers</Typography>
            <List>
              {/* Similar list for followers with view profile links */}
            </List>
          </Paper>
        </Box>
        <Box sx={{ width: { xs: '100%', md: '31%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Following</Typography>
            <List>
              {/* Similar list for following with view profile links */}
            </List>
          </Paper>
        </Box>
      </Box>
    </Box>
  );

  const renderRoleSpecificContent = () => {
    switch (profileData.userType) {
      case 'athlete':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Performance Stats</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Games Played" secondary={mockAthleteStats.gamesPlayed} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Goals" secondary={mockAthleteStats.goals} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Assists" secondary={mockAthleteStats.assists} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Total Points" secondary={mockAthleteStats.points} />
                  </ListItem>
                </List>
                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>Monthly Progress</Typography>
                  {mockAthleteStats.monthlyProgress.map((progress) => (
                    <Box key={progress.month} mb={1}>
                      <Typography variant="body2">{progress.month}</Typography>
                      <LinearProgress variant="determinate" value={progress.value} />
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Performance Videos</Typography>
                <Button
                  variant="contained"
                  startIcon={<VideoLibrary />}
                  fullWidth
                >
                  Upload New Video
                </Button>
                {renderVideoUpload()}
              </Paper>
            </Box>
          </Box>
        );

      case 'coach':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>My Athletes</Typography>
                {/* Athletes list */}
              </Paper>
            </Box>
            <Box sx={{ width: { xs: '100%', md: '48%' } }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Team Performance</Typography>
                {/* Team stats */}
              </Paper>
            </Box>
          </Box>
        );

      case 'team':
        return (
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Team Management</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Group />}
                    fullWidth
                  >
                    Manage Members
                  </Button>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Settings />}
                    fullWidth
                  >
                    Team Settings
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        );

      case 'company':
        return (
          <Box sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Sponsorship Dashboard</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Business />}
                    fullWidth
                  >
                    Manage Sponsorships
                  </Button>
                </Box>
                <Box sx={{ width: { xs: '100%', md: '48%' } }}>
                  <Button
                    variant="outlined"
                    startIcon={<Description />}
                    fullWidth
                  >
                    View Applications
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="error" variant="h6">{error}</Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/home')}
              sx={{ mt: 2 }}
            >
              Return to Home
            </Button>
          </Paper>
        ) : (
          <>
            {/* Profile Header */}
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box>
                  {renderProfilePictureUpload()}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4">{profileData.displayName || 'Anonymous'}</Typography>
                    {profileData.isVerified && (
                      <Tooltip title="Verified Profile">
                        <Verified color="primary" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography color="textSecondary">{profileData.email}</Typography>
                  <Box mt={1}>
                    <Chip label={profileData.userType} color="primary" sx={{ mr: 1 }} />
                    {profileData.sport && (
                      <Chip label={profileData.sport} sx={{ mr: 1 }} />
                    )}
                  </Box>
                </Box>
                <Box>
                  <Button
                    variant="contained"
                    startIcon={<Share />}
                    sx={{ mr: 1 }}
                  >
                    Share Profile
                  </Button>
                  <IconButton>
                    <BookmarkBorder />
                  </IconButton>
                </Box>
              </Box>
            </Paper>

            {/* Profile Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab icon={<Description />} label="Overview" />
                <Tab icon={<VideoLibrary />} label="Posts" />
                <Tab icon={<CalendarMonth />} label="Events" />
                <Tab icon={<Group />} label="Connections" />
              </Tabs>
            </Box>

            {/* Tab Panels */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {renderOverviewTab()}
              </Box>
            </TabPanel>
            <TabPanel value={activeTab} index={1}>
              {renderPostsTab()}
            </TabPanel>
            <TabPanel value={activeTab} index={2}>
              {renderEventsTab()}
            </TabPanel>
            <TabPanel value={activeTab} index={3}>
              {renderConnectionsTab()}
            </TabPanel>

            {/* Role-Specific Content */}
            {renderRoleSpecificContent()}
          </>
        )}
      </Container>
    </Box>
  );
};

export default Profile; 