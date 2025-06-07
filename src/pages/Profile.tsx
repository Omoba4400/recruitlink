import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  ListItemSecondaryAction,
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
  Instagram as InstagramIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon,
  PersonRemove,
  Share,
  BookmarkBorder,
  Description,
  CalendarMonth,
  Group,
  Business,
  Settings,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
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
import Post from '../components/posts/Post';
import { PostWithAuthor, Post as PostType, Reaction, ReactionType } from '../types/post';
import {
  createPost,
  getFeed,
  addReaction,
  removeReaction,
  addComment,
  deletePost,
  updatePost,
  sharePost,
} from '../services/post.service';
import { Timestamp, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { onPostDeleted } from '../events/postEvents';
import { emitPostDeleted } from '../events/postEvents';

const POST_LIMIT = 10;

interface DeleteDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  content: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({ open, onClose, onConfirm, title, content }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{content}</DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button onClick={onConfirm} color="error">Delete</Button>
    </DialogActions>
  </Dialog>
);

const defaultSocialLinks: SocialLinks = {
  instagram: '',
  twitter: '',
  linkedin: '',
  youtube: ''
};

const defaultPrivacySettings: PrivacySettings = {
  profileVisibility: 'public',
  allowMessagesFrom: 'everyone',
  showEmail: true,
  showLocation: true,
  showAcademicInfo: true,
  showAthleteStats: true,
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
  verificationStatus: 'pending',
  media: [],
  memberships: [],
  interests: [],
  activities: [],
  awards: [],
  achievements: [],
  eligibility: {
    isEligible: true
  },
  recruitingStatus: 'open'
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
  companyName: 'Not specified',
  coverageAreas: [],
  mediaType: []
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index, ...other }) => {
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
};

interface SocialLink {
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
}

interface PostsTabProps {
  userId: string;
  isOwnProfile: boolean;
  userType: string;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  hasMorePosts: boolean;
  setHasMorePosts: (hasMore: boolean) => void;
  editPost: string;
  setEditPost: (postId: string) => void;
  showDeleteDialog: boolean;
  setShowDeleteDialog: (show: boolean) => void;
  selectedPost: string;
  setSelectedPost: (postId: string) => void;
  posts: PostWithAuthor[];
  setPosts: React.Dispatch<React.SetStateAction<PostWithAuthor[]>>;
  lastVisible: DocumentSnapshot<DocumentData> | null;
  setLastVisible: (lastVisible: DocumentSnapshot<DocumentData> | null) => void;
}

const PostsTab: React.FC<PostsTabProps> = ({
  userId,
  isOwnProfile,
  userType,
  loading,
  setLoading,
  hasMorePosts,
  setHasMorePosts,
  editPost,
  setEditPost,
  showDeleteDialog,
  setShowDeleteDialog,
  selectedPost,
  setSelectedPost,
  posts,
  setPosts,
  lastVisible,
  setLastVisible
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((state: RootState) => state.auth.user);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Listen for post deletion events
  useEffect(() => {
    const cleanup = onPostDeleted((deletedPostId) => {
      console.log('PostsTab - Received post deleted event:', deletedPostId);
      setPosts((prevPosts) => prevPosts.filter(post => post.id !== deletedPostId));
    });

    return cleanup;
  }, [setPosts]);

  useEffect(() => {
    const loadPosts = async () => {
      if (!isInitialLoad) return;
      
      try {
        setLoading(true);
        const fetchedPosts = await getFeed(userId);
        setPosts(fetchedPosts.posts);
        setLastVisible(fetchedPosts.lastVisible);
        setHasMorePosts(fetchedPosts.hasMore);
      } catch (error) {
        console.error('Error loading posts:', error);
        enqueueSnackbar('Failed to load posts', { variant: 'error' });
      } finally {
        setLoading(false);
        setIsInitialLoad(false);
      }
    };

    loadPosts();
  }, [userId, isInitialLoad, enqueueSnackbar, setLoading, setPosts, setHasMorePosts, setLastVisible]);

  const handleLoadMore = async () => {
    if (!hasMorePosts || loading) return;

    try {
      setLoading(true);
      const morePosts = await getFeed(userId, lastVisible || undefined);
      setPosts((prevPosts: PostWithAuthor[]) => [...prevPosts, ...morePosts.posts]);
      setLastVisible(morePosts.lastVisible);
      setHasMorePosts(morePosts.hasMore);
    } catch (error) {
      console.error('Error loading more posts:', error);
      enqueueSnackbar('Failed to load more posts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = async () => {
    if (!selectedPost || !user?.uid) return;

    try {
      await deletePost(selectedPost, user.uid);
      setPosts((prevPosts: PostWithAuthor[]) => prevPosts.filter(post => post.id !== selectedPost));
      
      // Emit post deleted event
      emitPostDeleted(selectedPost);
      
      enqueueSnackbar('Post deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting post:', error);
      enqueueSnackbar('Failed to delete post', { variant: 'error' });
    } finally {
      setShowDeleteDialog(false);
      setSelectedPost('');
    }
  };

  const handlePostEdit = async (content: string) => {
    if (!editPost || !user?.uid) return;

    try {
      await updatePost(editPost, user.uid, { content });
      setPosts((prevPosts: PostWithAuthor[]) => prevPosts.map(post => 
        post.id === editPost ? { ...post, content } : post
      ));
      enqueueSnackbar('Post updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating post:', error);
      enqueueSnackbar('Failed to update post', { variant: 'error' });
    } finally {
      setEditPost('');
    }
  };

  const handleReaction = async (postId: string, reactionType: ReactionType) => {
    if (!user?.uid) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const hasReacted = post.reactions?.some(
        r => r.userId === user.uid && r.type === reactionType
      );

      if (hasReacted) {
        await removeReaction(postId, user.uid);
        setPosts((prevPosts: PostWithAuthor[]) => prevPosts.map(post => 
          post.id === postId ? {
            ...post,
            reactions: post.reactions.filter(r => !(r.userId === user.uid && r.type === reactionType))
          } : post
        ));
      } else {
        await addReaction(postId, user.uid, reactionType);
        const newReaction: Reaction = {
          userId: user.uid,
          type: reactionType,
          createdAt: Timestamp.now()
        };
        setPosts((prevPosts: PostWithAuthor[]) => prevPosts.map(post => 
          post.id === postId ? {
            ...post,
            reactions: [...post.reactions, newReaction]
          } : post
        ));
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      enqueueSnackbar('Failed to update reaction', { variant: 'error' });
    }
  };

  if (!user) {
    return (
      <Box textAlign="center" my={4}>
        <Typography variant="h6" color="text.secondary">
          Please sign in to view posts
        </Typography>
      </Box>
    );
  }

  return (
    <>
      {loading && posts.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : posts.length === 0 ? (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            No posts yet
          </Typography>
        </Box>
      ) : (
        <>
          {posts.map((post) => (
            <Post
              key={post.id}
              post={post}
              isOwnPost={isOwnProfile}
              onDelete={async () => {
                setSelectedPost(post.id);
                setShowDeleteDialog(true);
                return Promise.resolve();
              }}
              onEdit={async () => {
                setEditPost(post.id);
                return Promise.resolve();
              }}
              onReaction={async (type: ReactionType) => {
                try {
                  await handleReaction(post.id, type);
                } catch (error) {
                  console.error('Error adding reaction:', error);
                  enqueueSnackbar('Failed to add reaction', { variant: 'error' });
                }
              }}
            />
          ))}
          {hasMorePosts && (
            <Box display="flex" justifyContent="center" my={2}>
              <Button
                variant="outlined"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handlePostDelete}
        title="Delete Post"
        content="Are you sure you want to delete this post? This action cannot be undone."
      />
    </>
  );
};

const Profile: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((state: RootState) => state.auth.user);
  const profile = useSelector((state: RootState) => state.auth.profile);
  
  // All useState and useRef hooks at the top
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editPost, setEditPost] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<string>('');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const lastPostRef = useRef<any>(null);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const postsLoadedRef = useRef(false);

  // Memoize the PostsTab component props
  const postsTabProps = React.useMemo(() => ({
    userId: id || user?.uid || '',
    isOwnProfile: (id || user?.uid) === user?.uid,
    userType: profileData?.userType || '',
    loading: postsLoading,
    setLoading: setPostsLoading,
    hasMorePosts,
    setHasMorePosts,
    editPost,
    setEditPost,
    showDeleteDialog,
    setShowDeleteDialog,
    selectedPost,
    setSelectedPost,
    posts,
    setPosts,
    lastVisible,
    setLastVisible
  }), [id, user?.uid, profileData?.userType, postsLoading, hasMorePosts, editPost, showDeleteDialog, selectedPost, posts, lastVisible]);

  // Add cleanup effect for mounted ref
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  console.log('Profile Component - Initial Render:', {
    urlId: id,
    currentUserId: user?.uid,
    hasReduxProfile: !!profile,
    loading
  });

  // Effect to handle profile data loading
  useEffect(() => {
    const fetchProfileData = async (): Promise<void> => {
      try {
        console.log('fetchProfileData - Starting fetch for:', {
          urlId: id,
          currentUserId: user?.uid
        });

        // If no ID in URL and no current user, redirect to login
        if (!user && !id) {
          console.log('fetchProfileData - No ID or current user, redirecting to login');
          navigate('/login');
          return;
        }

        // Determine which ID to use
        const targetUserId = id || user?.uid;
        console.log('fetchProfileData - Target user ID:', targetUserId);

        if (!targetUserId) {
          console.log('fetchProfileData - No target user ID available');
          setError('No user ID available');
          setLoading(false);
          return;
        }

        // If viewing own profile and we have it in Redux, use that
        if (!id && profile && profile.uid === user?.uid) {
          console.log('fetchProfileData - Using Redux profile');
          setProfileData(profile);
          setLoading(false);
          return;
        }

        // Otherwise fetch from Firestore
        console.log('fetchProfileData - Fetching from Firestore');
        const profileData = await getUserProfile(targetUserId);
        console.log('fetchProfileData - Profile data received:', profileData);

        if (!profileData) {
          console.log('fetchProfileData - No profile data found');
          setError('Profile not found');
          setLoading(false);
          return;
        }

        // Update local state
        setProfileData(profileData);
        
        // If this is the current user's profile, update Redux
        if (targetUserId === user?.uid) {
          console.log('fetchProfileData - Updating Redux profile');
          dispatch(setProfile(profileData));
        }

        setLoading(false);
      } catch (error) {
        console.error('fetchProfileData - Error:', error);
        setError(error instanceof Error ? error.message : 'Error loading profile');
        setLoading(false);
      }
    };

    // Reset state when ID changes
    setLoading(true);
    setError(null);
    
    // Fetch profile data
    fetchProfileData();
  }, [id, user, profile, dispatch, navigate]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    // Reset posts state when switching to posts tab
    if (newValue === 1 && !postsLoadedRef.current) {
      postsLoadedRef.current = true;
      setPosts([]);
      setLastVisible(null);
      setHasMorePosts(true);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/home')}>
          Return to Home
        </Button>
      </Box>
    );
  }

  // Show not found state
  if (!profileData) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 3 }}>
        <Typography variant="h6">
          Profile not found
        </Typography>
        <Button variant="contained" onClick={() => navigate('/home')}>
          Return to Home
        </Button>
      </Box>
    );
  }

  const handleProfileUpdate = async (updatedData: Partial<UserProfile>) => {
    if (!profileData) return;

    try {
      // Only update Firestore and exit edit mode if Save button is clicked
      if (!isEditing) return;

      const newProfileData: UserProfile = {
        ...profileData,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      await updateUserProfile(newProfileData.uid, newProfileData);
      setProfileData(newProfileData);
      // Don't set isEditing to false here - let the Save button handle that
    } catch (error) {
      console.error('Error updating profile:', error);
      enqueueSnackbar('Failed to update profile', { variant: 'error' });
    }
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileData) return;
      await updateUserProfile(profileData.uid, profileData);
      setIsEditing(false);
      enqueueSnackbar('Profile updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error saving profile:', error);
      enqueueSnackbar('Failed to save profile', { variant: 'error' });
    }
  };

  const handleEditToggle = (): void => {
    setIsEditing(!isEditing);
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

  const handleSocialLinkClick = async (platform: string) => {
    if (!user) {
      enqueueSnackbar('Please sign in to link your social media accounts', { variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const result = await linkSocialAccount(platform, user.uid);
      
      if (result.cancelled) {
        enqueueSnackbar('Social media linking was cancelled', { variant: 'info' });
        return;
      }

      if (result.success) {
        // Update social links in the profile
        const updatedSocialLinks = {
          ...profileData?.socialLinks,
          [platform]: result.profileUrl
        };

        await updateSocialLinks(user.uid, updatedSocialLinks);
        enqueueSnackbar('Social media account linked successfully', { variant: 'success' });
      }
    } catch (error) {
      console.error('Error linking social account:', error);
      enqueueSnackbar('Failed to link social media account', { variant: 'error' });
    } finally {
      setLoading(false);
    }
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
                      {platform === 'instagram' && <InstagramIcon />}
                      {platform === 'twitter' && <TwitterIcon />}
                      {platform === 'linkedin' && <LinkedInIcon />}
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
              <IconButton onClick={() => setIsEditing(true)}>
                <EditIcon />
              </IconButton>
            ) : (
              <IconButton onClick={() => {
                handleProfileUpdate(profileData);
                setIsEditing(false);
              }} color="primary">
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

  const renderPostsTab = (): JSX.Element => {
    const currentUserId = id || user?.uid;
    if (!currentUserId) {
      return (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            Please sign in to view posts
          </Typography>
        </Box>
      );
    }
    
    return (
      <PostsTab
        userId={currentUserId}
        isOwnProfile={currentUserId === user?.uid}
        userType={profileData.userType}
        loading={postsLoading}
        setLoading={setPostsLoading}
        hasMorePosts={hasMorePosts}
        setHasMorePosts={setHasMorePosts}
        editPost={editPost}
        setEditPost={setEditPost}
        showDeleteDialog={showDeleteDialog}
        setShowDeleteDialog={setShowDeleteDialog}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
        posts={posts}
        setPosts={setPosts}
        lastVisible={lastVisible}
        setLastVisible={setLastVisible}
      />
    );
  };

  const renderEventsTab = (): JSX.Element => (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">Events</Typography>
        {profileData?.userType !== 'athlete' && (
          <Button
            variant="contained"
            startIcon={<Add />}
          >
            Create Event
          </Button>
        )}
      </Box>
      <Box textAlign="center" my={4}>
        <Typography variant="body1" color="text.secondary">
          No events available
        </Typography>
      </Box>
    </Box>
  );

  const renderConnectionsTab = (): JSX.Element => (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ width: { xs: '100%', md: '31%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Connected</Typography>
            <Box textAlign="center" my={4}>
              <Typography variant="body1" color="text.secondary">
                No connections yet
              </Typography>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ width: { xs: '100%', md: '31%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Followers</Typography>
            <Box textAlign="center" my={4}>
              <Typography variant="body1" color="text.secondary">
                No followers yet
              </Typography>
            </Box>
          </Paper>
        </Box>
        <Box sx={{ width: { xs: '100%', md: '31%' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Following</Typography>
            <Box textAlign="center" my={4}>
              <Typography variant="body1" color="text.secondary">
                Not following anyone yet
              </Typography>
            </Box>
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

  const renderAthleteFields = (): JSX.Element | null => {
    if (!profileData || profileData.userType !== 'athlete') return null;

    const athleteInfo = profileData.athleteInfo || defaultAthleteInfo;

    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="h6" gutterBottom>Athletic Information</Typography>
        <Grid container spacing={3}>
          {/* Sports & Position */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" gutterBottom>Primary Sport</Typography>
              {isEditing ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Sport"
                    value={athleteInfo.sports[0].sport}
                    onChange={(e) => handleAthleteInfoChange('sports', [{ ...athleteInfo.sports[0], sport: e.target.value }])}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Position"
                    value={athleteInfo.sports[0].position}
                    onChange={(e) => handleAthleteInfoChange('sports', [{ ...athleteInfo.sports[0], position: e.target.value }])}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    label="Level"
                    value={athleteInfo.sports[0].level}
                    onChange={(e) => handleAthleteInfoChange('sports', [{ ...athleteInfo.sports[0], level: e.target.value }])}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Years of Experience"
                    value={athleteInfo.sports[0].experience}
                    onChange={(e) => handleAthleteInfoChange('sports', [{ ...athleteInfo.sports[0], experience: Number(e.target.value) }])}
                  />
                </Box>
              ) : (
                <List dense>
                  <ListItem>
                    <ListItemText primary="Sport" secondary={athleteInfo.sports[0].sport || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Position" secondary={athleteInfo.sports[0].position || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Level" secondary={athleteInfo.sports[0].level || 'Not specified'} />
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Experience" secondary={`${athleteInfo.sports[0].experience || 0} years`} />
                  </ListItem>
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const handleAthleteInfoChange = (field: keyof AthleteInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'athlete') return;

    const currentInfo = profileData.athleteInfo || defaultAthleteInfo;

    if (field === 'academicInfo') {
      setProfileData({
        ...profileData,
        athleteInfo: {
          ...currentInfo,
          academicInfo: {
            ...currentInfo.academicInfo,
            ...value
          }
        }
      });
    } else if (field === 'sports') {
      setProfileData({
        ...profileData,
        athleteInfo: {
          ...currentInfo,
          sports: value
        }
      });
    } else {
      setProfileData({
        ...profileData,
        athleteInfo: {
          ...currentInfo,
          [field]: value
        }
      });
    }
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
      </List>
    );
  };

  const handleCoachInfoChange = (field: keyof CoachInfo, value: any): void => {
    if (!profileData || profileData.userType !== 'coach') return;

    const currentInfo = profileData.coachInfo || defaultCoachInfo;

    setProfileData({
      ...profileData,
      coachInfo: {
        ...currentInfo,
        [field]: value
      }
    });
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
              <React.Suspense fallback={<CircularProgress />}>
                <PostsTab {...postsTabProps} />
              </React.Suspense>
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