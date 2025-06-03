import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
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
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import Header from '../components/layout/Header';
import { uploadToCloudinary } from '../config/cloudinary';
import { getUserProfile, updateUserProfile, updateSocialLinks } from '../services/user.service';
import { useSnackbar } from 'notistack';
import { linkSocialAccount } from '../services/social-auth.service';
import { setProfile } from '../store/slices/authSlice';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { User as FirebaseUser } from 'firebase/auth';
import type {
  User,
  UserProfile,
  UserType,
  AthleteInfo,
  CoachInfo,
  TeamInfo,
  SponsorInfo,
  MediaInfo,
  PrivacySettings,
  SocialLinks,
  AthleteStats,
  AcademicInfo
} from '../types/user';
import { useAuth } from '../contexts/AuthContext';

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

// Helper function to convert auth user type to profile user type
const mapUserType = (authType: UserType): UserType => {
  switch (authType) {
    case 'athlete':
      return 'athlete';
    case 'coach':
      return 'coach';
    case 'team':
      return 'team';
    case 'sponsor':
      return 'sponsor';
    case 'media':
      return 'media';
    case 'fan':
      return 'fan';
    default:
      return 'fan';
  }
};

const Profile: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const reduxProfile = useSelector((state: RootState) => state.auth.profile);
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const { userId } = useParams();

  console.log('Profile render - user:', user);
  console.log('Profile render - reduxProfile:', reduxProfile);

  const defaultSocialLinks: SocialLinks = {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    youtube: '',
    website: ''
  };

  const defaultPrivacySettings: PrivacySettings = {
    profileVisibility: 'public' as const,
    allowMessagesFrom: 'everyone' as const,
    showEmail: true,
    showLocation: true,
    showAcademicInfo: true,
    showAthleteStats: true
  };

  const defaultAthleteInfo: AthleteInfo = {
    sports: [{
      sport: 'Not specified',
      position: 'Not specified',
      level: 'Not specified',
      experience: 0,
      specialties: [],
      achievements: []
    }],
    academicInfo: {
      currentSchool: '',
      graduationYear: ''
    },
    verificationStatus: 'pending' as const,
    media: [],
    memberships: [],
    interests: [],
    activities: [],
    awards: [],
    achievements: [],
    eligibility: {
      isEligible: true
    },
    recruitingStatus: 'open' as const
  };

  const defaultCoachInfo: CoachInfo = {
    specialization: [],
    experience: '',
    certifications: [],
    canMessageAthletes: false,
    verificationStatus: 'pending'
  };

  const defaultTeamInfo: TeamInfo = {
    teamName: 'Not specified',
    sport: 'Not specified',
    canMessageAthletes: false,
    achievements: [],
    roster: [],
    openPositions: []
  };

  const defaultSponsorInfo: SponsorInfo = {
    companyName: 'Not specified',
    industry: 'Not specified',
    canMessageAthletes: false,
    sponsorshipTypes: [],
    activeOpportunities: []
  };

  const defaultMediaInfo: MediaInfo = {
    organization: 'Not specified',
    canMessageAthletes: false,
    coverageAreas: [],
    mediaType: []
  };

  const convertAuthUserToProfile = (authUser: FirebaseUser): UserProfile => {
    const profile: UserProfile = {
      uid: authUser.uid,
      email: authUser.email || '',
      displayName: authUser.displayName || '',
      userType: 'athlete' as UserType,
      photoURL: authUser.photoURL || undefined,
      bio: '',
      location: '',
      verified: false,
      verificationStatus: 'none',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      socialLinks: defaultSocialLinks,
      privacySettings: defaultPrivacySettings,
      athleteInfo: defaultAthleteInfo,
      followers: [],
      following: [],
      connections: []
    };

    return profile;
  };

  const [profileData, setProfileData] = useState<UserProfile | null>(null);

  useEffect(() => {
    console.log('Profile useEffect - user:', user);
    console.log('Profile useEffect - profileData:', profileData);
    console.log('Profile useEffect - reduxProfile:', reduxProfile);

    let isMounted = true;

    const fetchProfileData = async (): Promise<void> => {
      try {
        console.log('Fetching profile for user');
        setLoading(true);
        setError(null);

        const targetUserId = userId || user?.uid;
        if (!targetUserId) {
          throw new Error('No user available');
        }

        // If viewing own profile and we have redux profile data, use that
        if (!userId && reduxProfile) {
          setProfileData(reduxProfile);
          setLoading(false);
          return;
        }

        // Try to get the existing profile
        const userData = await getUserProfile(targetUserId);
        console.log('Fetched user data:', userData);
        
        if (userData) {
          if (isMounted) {
            // Ensure we have the correct structure for athleteInfo with required fields
            const updatedUserData: UserProfile = {
              ...userData,
              athleteInfo: userData.userType === 'athlete' ? {
                ...userData.athleteInfo,
                sports: userData.athleteInfo?.sports || [{
                  sport: '',
                  position: '',
                  level: '',
                  experience: 0,
                  specialties: [],
                  achievements: []
                }],
                academicInfo: userData.athleteInfo?.academicInfo || {
                  currentSchool: '',
                  graduationYear: ''
                },
                verificationStatus: userData.athleteInfo?.verificationStatus || 'pending',
                media: userData.athleteInfo?.media || [],
                memberships: userData.athleteInfo?.memberships || [],
                interests: userData.athleteInfo?.interests || [],
                activities: userData.athleteInfo?.activities || [],
                awards: userData.athleteInfo?.awards || [],
                achievements: userData.athleteInfo?.achievements || [],
                eligibility: userData.athleteInfo?.eligibility || {
                  isEligible: true
                },
                recruitingStatus: userData.athleteInfo?.recruitingStatus || 'open'
              } : undefined
            };

            // If viewing own profile, update redux state
            if (!userId) {
              dispatch(setProfile(updatedUserData));
            }

            setProfileData(updatedUserData);
            setLoading(false);
          }
        } else {
          setError('Profile not found');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        if (isMounted) {
          setError(error instanceof Error ? error.message : 'Failed to load profile');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProfileData();

    return () => {
      isMounted = false;
    };
  }, [user, userId, reduxProfile, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number): void => {
    setActiveTab(newValue);
  };

  const handleEditToggle = (): void => {
    setIsEditing(!isEditing);
  };

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    if (!profileData) return;

    const newProfileData: UserProfile = {
      ...profileData,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    try {
      await updateUserProfile(newProfileData.uid, newProfileData);
      setProfileData(newProfileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAthleteInfoChange = (field: keyof AthleteInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'athlete') return;

    const currentInfo = profileData.athleteInfo || defaultAthleteInfo;

    if (field === 'academicInfo') {
      handleProfileUpdate({
        athleteInfo: {
          ...currentInfo,
          academicInfo: {
            ...currentInfo.academicInfo,
            ...value
          }
        }
      });
    } else if (field === 'sports') {
      handleProfileUpdate({
        athleteInfo: {
          ...currentInfo,
          sports: value
        }
      });
    } else {
      handleProfileUpdate({
        athleteInfo: {
          ...currentInfo,
          [field]: value
        }
      });
    }
  };

  const handleSportChange = (sport: string): void => {
    if (!profileData || profileData.userType !== 'athlete') return;

    const currentInfo = profileData.athleteInfo || defaultAthleteInfo;

    handleProfileUpdate({
      athleteInfo: {
        ...currentInfo,
        sports: [{
          ...currentInfo.sports[0],
          sport
        }]
      }
    });
  };

  const handlePositionChange = (position: string): void => {
    if (!profileData || profileData.userType !== 'athlete') return;

    const currentInfo = profileData.athleteInfo || defaultAthleteInfo;

    handleProfileUpdate({
      athleteInfo: {
        ...currentInfo,
        sports: [{
          ...currentInfo.sports[0],
          position
        }]
      }
    });
  };

  const handleGraduationYearChange = (graduationYear: string): void => {
    if (!profileData || profileData.userType !== 'athlete') return;

    const currentInfo = profileData.athleteInfo || defaultAthleteInfo;

    handleProfileUpdate({
      athleteInfo: {
        ...currentInfo,
        academicInfo: {
          ...currentInfo.academicInfo,
          graduationYear
        }
      }
    });
  };

  const handleCoachInfoChange = (field: keyof CoachInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'coach') return;

    const currentInfo = profileData.coachInfo || defaultCoachInfo;

    handleProfileUpdate({
      coachInfo: {
        ...currentInfo,
        [field]: value
      }
    });
  };

  const handleTeamInfoChange = (field: keyof TeamInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'team') return;

    const currentInfo = profileData.teamInfo || defaultTeamInfo;

    handleProfileUpdate({
      teamInfo: {
        ...currentInfo,
        [field]: value
      }
    });
  };

  const handleSponsorInfoChange = (field: keyof SponsorInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'sponsor') return;

    const currentInfo = profileData.sponsorInfo || defaultSponsorInfo;

    handleProfileUpdate({
      sponsorInfo: {
        ...currentInfo,
        [field]: value
      }
    });
  };

  const handleMediaInfoChange = (field: keyof MediaInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'media') return;

    const currentInfo = profileData.mediaInfo || defaultMediaInfo;

    handleProfileUpdate({
      mediaInfo: {
        ...currentInfo,
        [field]: value
      }
    });
  };

  const handleSocialLinkChange = (platform: keyof SocialLinks, value: string) => {
    if (!profileData) return;

    handleProfileUpdate({
      socialLinks: {
        ...profileData.socialLinks,
        [platform]: value
      }
    });
  };

  const handlePrivacySettingChange = (setting: keyof PrivacySettings, value: boolean | string) => {
    if (!profileData) return;

    handleProfileUpdate({
      privacySettings: {
        ...profileData.privacySettings,
        [setting]: value
      }
    });
  };

  const handleSocialLinkClick = async (platform: string) => {
    if (!user) {
      enqueueSnackbar('Please sign in to link your social media accounts', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const { success, cancelled, profileUrl } = await linkSocialAccount(platform, user.uid);
      
      if (cancelled) {
        // User cancelled the popup - no need to show any error message
        return;
      }
      
      if (success && profileUrl) {
        // Update local state
        handleProfileUpdate({
          socialLinks: {
            ...profileData!.socialLinks,
            [platform]: profileUrl
          }
        });
        enqueueSnackbar(`Successfully linked your ${platform} account!`, { variant: 'success' });
      }
    } catch (error: any) {
      console.error('Error linking social account:', error);
      
      // For setup instructions (multi-line error messages), use a dialog
      if (error.message.includes('Authentication provider') && error.message.includes('not enabled')) {
        // Show setup instructions in a dialog
        enqueueSnackbar('Provider not enabled. Check console for setup instructions.', { 
          variant: 'warning',
          autoHideDuration: 10000,
        });
        // Log setup instructions in a formatted way
        console.log('\n' + error.message);
      } else {
        // For other errors, show in snackbar
        enqueueSnackbar(error.message || `Failed to link ${platform} account`, { 
          variant: 'error',
          autoHideDuration: 6000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' = 'image'): Promise<void> => {
    if (!profileData || !user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, type);
      if (!url || typeof url !== 'string') {
        throw new Error('Failed to get upload URL');
      }

      if (type === 'image') {
        // Update profile picture
        const updatedData: UserProfile = {
          ...profileData,
          photoURL: url,
          updatedAt: new Date().toISOString(),
        };
        handleProfileUpdate(updatedData);
        
        // Update user profile in Firebase
        await updateUserProfile(user.uid, { photoURL: url });
        
        // Update Redux store with the current user's profile data
        dispatch(setProfile(updatedData));
        
        enqueueSnackbar('Profile picture updated successfully', { variant: 'success' });
      } else {
        // Handle video upload for athlete highlights
        if (profileData.userType === 'athlete' && profileData.athleteInfo) {
          const updatedData: UserProfile = {
            ...profileData,
            athleteInfo: {
              ...profileData.athleteInfo,
              achievements: [...(profileData.athleteInfo.achievements || [])]
            },
            updatedAt: new Date().toISOString(),
          };
          handleProfileUpdate(updatedData);
          
          // Update achievements in Firebase
          await updateUserProfile(user.uid, {
            athleteInfo: updatedData.athleteInfo,
          });
          
          // Update Redux store with the current user's profile data
          dispatch(setProfile(updatedData));
          
          enqueueSnackbar('Video uploaded successfully', { variant: 'success' });
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      enqueueSnackbar('Failed to upload file. Please try again.', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleVerificationRequest = () => {
    navigate('/verify');
  };

  const renderVerificationStatus = () => {
    if (!profileData) return null;

    const isPending = profileData.verificationStatus === 'pending';
    const isApproved = profileData.verificationStatus === 'approved';
    const isRejected = profileData.verificationStatus === 'rejected';

    return (
      <Box sx={{ width: '100%' }}>
        <Paper sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center">
              <Verified 
                color={isApproved ? "primary" : "action"} 
                sx={{ mr: 1 }} 
              />
              <Box>
                <Typography variant="h6">Verification Status</Typography>
                <Typography variant="body2" color="textSecondary">
                  {isPending && "Your verification request is being reviewed"}
                  {isApproved && "Your profile is verified"}
                  {isRejected && "Your verification request was rejected"}
                  {profileData.verificationStatus === 'none' && "Request verification to get a blue checkmark"}
                </Typography>
              </Box>
            </Box>
            {!isApproved && (
              <Button
                variant="contained"
                color="primary"
                startIcon={<Verified />}
                onClick={handleVerificationRequest}
                disabled={isPending}
              >
                {isPending ? 'Pending Review' : 'Request Verification'}
              </Button>
            )}
          </Box>
        </Paper>
      </Box>
    );
  };

  const renderSocialLinks = (): JSX.Element => {
    if (!profileData?.socialLinks) return <></>;

    return (
      <>
        {Object.entries(profileData.socialLinks).map(([platform, url]) => (
          <ListItem key={platform}>
            <ListItemAvatar>
              <IconButton 
                onClick={() => handleSocialLinkClick(platform)}
                sx={{ 
                  '&:hover': { 
                    transform: 'scale(1.1)',
                    transition: 'transform 0.2s'
                  } 
                }}
                disabled={loading}
              >
                <Avatar sx={{ 
                  bgcolor: url ? 'success.main' : 'primary.main',
                  opacity: loading ? 0.7 : 1
                }}>
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    <>
                      {platform === 'instagram' && <Instagram />}
                      {platform === 'twitter' && <Twitter />}
                      {platform === 'linkedin' && <LinkedIn />}
                    </>
                  )}
                </Avatar>
              </IconButton>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Typography>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </Typography>
                  {url && (
                    <Tooltip title="Account linked">
                      <Check sx={{ ml: 1, color: 'success.main', fontSize: 16 }} />
                    </Tooltip>
                  )}
                </Box>
              }
              secondary={
                <Typography variant="body2" color="textSecondary">
                  {url ? (
                    <Link href={url} target="_blank" rel="noopener noreferrer">
                      View Profile
                    </Link>
                  ) : (
                    'Click icon to link account'
                  )}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </>
    );
  };

  const renderProfilePictureUpload = (): JSX.Element | null => {
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

  const renderVideoUpload = (): JSX.Element | null => {
    if (!profileData || profileData.userType !== 'athlete' || !profileData.athleteInfo) return null;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>Highlights / Videos</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {(profileData.athleteInfo.achievements || []).map((videoUrl: string, index: number) => (
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
                        if (profileData.athleteInfo) {
                          const achievements = [...(profileData.athleteInfo.achievements || [])];
                          achievements.splice(index, 1);
                          handleProfileUpdate({
                            athleteInfo: {
                              ...profileData.athleteInfo,
                              achievements,
                            },
                          });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Box>
          ))}
          {isEditing && (!profileData.athleteInfo.achievements || profileData.athleteInfo.achievements.length < 5) && (
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

  const renderAthleteFields = (): JSX.Element | null => {
    if (!profileData || profileData.userType !== 'athlete') return null;

    const athleteInfo = profileData.athleteInfo || defaultAthleteInfo;

    return (
      <List>
        <ListItem>
          <ListItemText
            primary="Sport & Position"
            secondary={isEditing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  value={athleteInfo.sports[0].sport}
                  onChange={(e) => handleAthleteInfoChange('sports', [{ ...athleteInfo.sports[0], sport: e.target.value }])}
                  placeholder="Sport"
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  value={athleteInfo.sports[0].position}
                  onChange={(e) => handleAthleteInfoChange('sports', [{ ...athleteInfo.sports[0], position: e.target.value }])}
                  placeholder="Position"
                  sx={{ flex: 1 }}
                />
              </Box>
            ) : `${athleteInfo.sports[0].sport} - ${athleteInfo.sports[0].position || 'Not specified'}`}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Graduation Year"
            secondary={isEditing ? (
              <TextField
                fullWidth
                size="small"
                value={athleteInfo.academicInfo.graduationYear || ''}
                onChange={(e) => handleAthleteInfoChange('academicInfo', { ...athleteInfo.academicInfo, graduationYear: e.target.value })}
              />
            ) : athleteInfo.academicInfo.graduationYear || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Stats"
            secondary={isEditing ? (
              <TextField
                fullWidth
                size="small"
                multiline
                rows={3}
                value={Object.entries(athleteInfo.stats || {}).map(([key, value]) => `${key}: ${value}`).join('\n')}
                onChange={(e) => {
                  const stats: Record<string, string> = {};
                  e.target.value.split('\n').forEach(line => {
                    const [key, value] = line.split(':').map(s => s.trim());
                    if (key && value) {
                      stats[key] = value;
                    }
                  });
                  handleAthleteInfoChange('stats', stats);
                }}
                placeholder="Enter stats in key: value format, one per line"
              />
            ) : Object.entries(athleteInfo.stats || {}).map(([key, value]) => (
              <div key={key}>{key}: {value}</div>
            ))}
          />
        </ListItem>
      </List>
    );
  };

  const renderCoachFields = (): JSX.Element | null => {
    if (!profileData || profileData.userType !== 'coach') return null;

    const coachInfo = profileData.coachInfo || defaultCoachInfo;

    return (
      <List>
        <ListItem>
          <ListItemText
            primary="Specialization & Experience"
            secondary={isEditing ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small"
                  value={coachInfo.specialization.join(', ')}
                  onChange={(e) => handleCoachInfoChange('specialization', e.target.value.split(',').map(s => s.trim()))}
                  placeholder="Specialization (comma separated)"
                  sx={{ flex: 1 }}
                />
                <TextField
                  size="small"
                  value={coachInfo.experience || ''}
                  onChange={(e) => handleCoachInfoChange('experience', e.target.value)}
                  placeholder="Years of Experience"
                  sx={{ flex: 1 }}
                />
              </Box>
            ) : `${coachInfo.specialization.join(', ')} - ${coachInfo.experience || 'Not specified'}`}
          />
        </ListItem>
        <ListItem>
          <ListItemText
            primary="Current Team"
            secondary={isEditing ? (
              <TextField
                fullWidth
                size="small"
                value={coachInfo.currentTeam || ''}
                onChange={(e) => handleCoachInfoChange('currentTeam', e.target.value)}
              />
            ) : coachInfo.currentTeam || 'Not specified'}
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
                value={coachInfo.certifications?.join('\n') || ''}
                onChange={(e) => handleCoachInfoChange('certifications', e.target.value.split('\n').map(s => s.trim()))}
                placeholder="Enter certifications, one per line"
              />
            ) : coachInfo.certifications?.join(', ') || 'Not specified'}
          />
        </ListItem>
      </List>
    );
  };

  const renderTeamFields = () => {
    if (!profileData?.teamInfo) return null;

    const teamInfo = profileData.teamInfo;
    const fields = [
      { key: 'teamName', label: 'Team Name', icon: <Group /> },
      { key: 'sport', label: 'Sport', icon: <Business /> },
      { key: 'achievements', label: 'Achievements', icon: <EmojiEvents /> },
      { key: 'openPositions', label: 'Open Positions', icon: <Group /> }
    ] as const;

    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Team Information
        </Typography>
        <List>
          {fields.map(({ key, label, icon }) => (
            <ListItem key={key}>
              <ListItemIcon>
                {icon}
              </ListItemIcon>
              <ListItemText
                primary={label}
                secondary={
                  Array.isArray(teamInfo[key])
                    ? (teamInfo[key] as string[]).join(', ') || 'None'
                    : teamInfo[key] || 'Not specified'
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>
    );
  };

  const renderTeamContent = () => {
    if (!profileData) return null;

    switch (profileData.userType) {
      case 'athlete':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {renderAthleteFields()}
          </Box>
        );
      case 'coach':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {renderCoachFields()}
          </Box>
        );
      case 'team':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {renderTeamFields()}
          </Box>
        );
      case 'sponsor':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Sponsor-specific content */}
          </Box>
        );
      case 'media':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Media-specific content */}
          </Box>
        );
      case 'college':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* College-specific content */}
          </Box>
        );
      default:
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Typography>No additional information available</Typography>
          </Box>
        );
    }
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
  const isOwnProfile = user?.uid === profileData.uid;

  const renderOverviewTab = (): JSX.Element => (
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
              <IconButton onClick={() => handleProfileUpdate({})} color="primary">
                <SaveIcon />
              </IconButton>
            )}
          </Box>
          {isEditing ? (
            <>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={profileData.bio || ''}
                onChange={(e) => handleProfileUpdate({ bio: e.target.value })}
                placeholder="Tell us about yourself..."
                sx={{ mb: 2 }}
              />
              <LocationAutocomplete
                value={profileData.location || ''}
                onChange={(location) => handleProfileUpdate({ location })}
                disabled={!isEditing}
              />
            </>
          ) : (
            <>
              <Typography sx={{ mb: 2 }}>{profileData.bio || 'No bio added yet.'}</Typography>
              {profileData.location && (
                <Box display="flex" alignItems="center">
                  <LocationOn sx={{ mr: 1, color: 'action.active' }} />
                  <Typography color="textSecondary">{profileData.location}</Typography>
                </Box>
              )}
            </>
          )}
        </Paper>
      </Box>

      {/* Role-Specific Details Section */}
      <Box sx={{ width: { xs: '100%', md: '48%' } }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Details</Typography>
          {renderTeamContent()}
        </Paper>
      </Box>

      {/* Social Links Section */}
      <Box sx={{ width: { xs: '100%', md: '48%' } }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Social Media</Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Click on the social media icons to set up your profiles
          </Typography>
          <List>
            {renderSocialLinks()}
          </List>
        </Paper>
      </Box>

      {/* Verification Status */}
      {renderVerificationStatus()}
    </Box>
  );

  const renderPostsTab = (): JSX.Element => (
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

  const renderEventsTab = (): JSX.Element => (
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

  const renderConnectionsTab = (): JSX.Element => (
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

  const renderRoleSpecificContent = (): JSX.Element | null => {
    if (!profileData) return null;

    switch (profileData.userType) {
      case 'athlete':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Athlete-specific content */}
          </Box>
        );
      case 'coach':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Coach-specific content */}
          </Box>
        );
      case 'team':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {renderTeamFields()}
          </Box>
        );
      case 'sponsor':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Sponsor-specific content */}
          </Box>
        );
      case 'media':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* Media-specific content */}
          </Box>
        );
      case 'college':
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {/* College-specific content */}
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
                    {profileData.verificationStatus === 'approved' && (
                      <Tooltip title="Verified Profile">
                        <Verified color="primary" sx={{ ml: 1 }} />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography color="textSecondary">{profileData.email}</Typography>
                  <Box mt={1}>
                    <Chip label={profileData.userType} color="primary" sx={{ mr: 1 }} />
                    {profileData.athleteInfo?.sports[0].sport && (
                      <Chip label={profileData.athleteInfo.sports[0].sport} sx={{ mr: 1 }} />
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