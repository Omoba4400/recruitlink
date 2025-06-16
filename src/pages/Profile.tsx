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
  School,
  Work,
  Star,
  Timeline,
  Lightbulb,
  Sports,
  MenuBook,
  Assignment,
  Cake,
  Email,
  Phone,
  Language,
  Public,
  Lock,
  People,
  PersonAdd,
  MoreHoriz,
  Category,
  LocalOffer,
  SportsSoccer,
  Groups,
} from '@mui/icons-material';
import Header from '../components/layout/Header';
import { uploadToCloudinary } from '../config/cloudinary';
import { getUserProfile, updateUserProfile, updateSocialLinks } from '../services/user.service';
import { useSnackbar } from 'notistack';
import { linkSocialAccount } from '../services/social-auth.service';
import { setProfile, setUser } from '../store/slices/authSlice';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { User as FirebaseUser } from 'firebase/auth';
import type {
  User,
  UserProfile,
  UserType,
  AthleteInfo,
  CoachInfo,
  CollegeInfo,
  SponsorInfo,
  MediaInfo,
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
  getUserPosts,
  getPost
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

const defaultCollegeInfo: CollegeInfo = {
  name: '',
  location: '',
  division: '',
  conference: '',
  sports: [],
  teams: [],
  admissionRequirements: {
    gpa: undefined,
    sat: undefined,
    act: undefined,
    otherRequirements: []
  },
  athleticScholarships: {
    available: false,
    types: [],
    requirements: []
  }
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
      try {
        console.log('Loading posts for user:', userId);
        setLoading(true);
        const fetchedPosts = await getUserPosts(userId);
        console.log('Fetched posts:', fetchedPosts);
        setPosts(fetchedPosts.posts);
        setLastVisible(fetchedPosts.lastVisible);
        setHasMorePosts(fetchedPosts.hasMore);
      } catch (error) {
        console.error('Error loading posts:', error);
        enqueueSnackbar('Failed to load posts', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      console.log('Starting post load for user:', userId);
      loadPosts();
    } else {
      console.log('No userId available, skipping post load');
    }
  }, [userId, enqueueSnackbar, setLoading, setPosts, setHasMorePosts, setLastVisible]);

  const handleLoadMore = async () => {
    if (!hasMorePosts || loading) return;

    try {
      setLoading(true);
      const morePosts = await getUserPosts(userId, lastVisible || undefined);
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
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const lastPostRef = useRef<any>(null);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const postsLoadedRef = useRef(false);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<File[]>([]);
  const [postMediaPreviews, setPostMediaPreviews] = useState<string[]>([]);
  const [isPostingLoading, setIsPostingLoading] = useState(false);
  const postMediaInputRef = useRef<HTMLInputElement>(null);

  // Don't show connect/follow buttons if viewing own profile
  const isOwnProfile = user?.uid === profileData?.uid;

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

  const handleProfileUpdate = (updatedData: Partial<UserProfile>) => {
    if (!profileData) return;

    // Only update local state
    const newProfileData: UserProfile = {
      ...profileData,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };

    setProfileData(newProfileData);
  };

  const handleSaveProfile = async () => {
    try {
      if (!profileData || !user) return;
      
      // Save to Firebase and update Redux only when actually saving
      await updateUserProfile(profileData.uid, profileData);
      dispatch(setProfile(profileData));
      setIsEditing(false);
      enqueueSnackbar('Profile saved successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error saving profile:', error);
      enqueueSnackbar('Failed to save profile', { variant: 'error' });
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If we're currently editing, save changes
      handleSaveProfile();
    } else {
      // If we're not editing, enter edit mode
      setIsEditing(true);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'banner' = 'image'): Promise<void> => {
    if (!profileData || !user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const url = await uploadToCloudinary(file, type === 'banner' ? 'image' : type);
      if (!url || typeof url !== 'string') {
        throw new Error('Failed to get upload URL');
      }

      let updatedData: Partial<UserProfile> = {};

      if (type === 'banner') {
        updatedData = { bannerURL: url };
      } else if (type === 'image') {
        updatedData = { photoURL: url };
      } else if (type === 'video' && profileData.userType === 'athlete' && profileData.athleteInfo) {
        updatedData = {
          athleteInfo: {
            ...profileData.athleteInfo,
            achievements: [...(profileData.athleteInfo.achievements || [])]
          }
        };
      }

      // Update local state
      handleProfileUpdate(updatedData);

      // Save to Firebase and update Redux
      await updateUserProfile(user.uid, updatedData);
      
      // Update both profile and user in Redux
      const updatedProfile = { ...profileData, ...updatedData };
      dispatch(setProfile(updatedProfile));
      dispatch(setUser({ ...user, ...updatedData }));

      enqueueSnackbar(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Upload failed:', error);
      enqueueSnackbar('Failed to upload file. Please try again.', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  const handleVerificationRequest = () => {
    if (!profileData) return;
    
    // Just navigate to verification page without changing status
    // Status will be updated after documents are uploaded
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

  const handlePostDialogClose = () => {
    setOpenPostDialog(false);
    setNewPostContent('');
    setNewPostMedia([]);
    setPostMediaPreviews([]);
  };

  const handlePostMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setNewPostMedia(prevMedia => [...prevMedia, ...files]);
    
    // Create preview URLs for the selected media
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostMediaPreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    setNewPostMedia(prev => prev.filter((_, i) => i !== index));
    setPostMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!user || !profileData || !newPostContent.trim()) return;

    setIsPostingLoading(true);
    try {
      // Upload media files if any
      const mediaUrls = [];
      for (const mediaFile of newPostMedia) {
        const url = await uploadToCloudinary(mediaFile, mediaFile.type.startsWith('video/') ? 'video' : 'image');
        if (url) mediaUrls.push(url);
      }

      // Create the post
      const postId = await createPost(user.uid, {
        content: newPostContent,
        media: mediaUrls.map(url => ({
          id: url,
          type: 'image',
          url: url,
          path: url,
          filename: 'uploaded-media'
        })),
        visibility: 'public'
      });

      if (postId) {
        // Get the created post with author info
        const newPost = await getPost(postId);
        if (newPost) {
          // Update posts list
          setPosts(prevPosts => [newPost, ...prevPosts]);
          
          handlePostDialogClose();
          enqueueSnackbar('Post created successfully', { variant: 'success' });
        }
      }
    } catch (error) {
      console.error('Error creating post:', error);
      enqueueSnackbar('Failed to create post', { variant: 'error' });
    } finally {
      setIsPostingLoading(false);
    }
  };

  const renderProfileHeader = () => (
    <Box>
      {/* Banner Section */}
      <Box
        sx={{
          position: 'relative',
          height: '200px',
          bgcolor: 'grey.200',
          borderRadius: '8px 8px 0 0',
          backgroundImage: profileData?.bannerURL ? `url(${profileData.bannerURL})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          mb: 2
        }}
      >
        {isOwnProfile && (
          <IconButton
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              bgcolor: 'background.paper',
              '&:hover': { bgcolor: 'background.paper' }
            }}
            onClick={() => {
              if (bannerFileInputRef.current) {
                bannerFileInputRef.current.click();
              }
            }}
          >
            {uploading ? (
              <CircularProgress size={24} />
            ) : (
              <EditIcon />
            )}
          </IconButton>
        )}
        <input
          type="file"
          ref={bannerFileInputRef}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={(e) => handleFileUpload(e, 'banner')}
        />
      </Box>

      {/* Profile Info Section */}
      <Box sx={{ px: 3, pb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
          {/* Profile Picture Section - Positioned to overlap banner */}
          <Box sx={{ 
            position: 'relative',
            mt: '-85px', // Pull up to overlap with banner
            mb: 2,
            display: 'flex',
            alignItems: 'flex-end'
          }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                isOwnProfile && (
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      boxShadow: 1,
                      '&:hover': { bgcolor: 'background.paper' }
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <EditIcon fontSize="small" />
                    )}
                  </IconButton>
                )
              }
            >
              <Avatar
                sx={{
                  width: 150,
                  height: 150,
                  border: '4px solid white',
                  boxShadow: 1
                }}
                src={profileData?.photoURL || undefined}
              >
                {profileData?.displayName?.[0]}
              </Avatar>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
            </Badge>

            {/* Name and Title Section */}
            <Box sx={{ ml: 3, mb: 1 }}>
              {isEditing ? (
                <TextField
                  fullWidth
                  value={profileData?.displayName || ''}
                  onChange={(e) => handleProfileUpdate({ displayName: e.target.value })}
                  sx={{ mb: 1 }}
                />
              ) : (
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {profileData?.displayName || 'Anonymous'}
                </Typography>
              )}
              <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 0.5 }}>
                {profileData?.userType.charAt(0).toUpperCase() + profileData?.userType.slice(1)}
              </Typography>
              {profileData?.location && (
                <Box display="flex" alignItems="center" sx={{ mt: 1 }}>
                  <LocationOn sx={{ fontSize: 20, mr: 0.5, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {profileData.location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Edit Profile Button */}
          {isOwnProfile && (
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                startIcon={isEditing ? <SaveIcon /> : <EditIcon />}
                onClick={handleEditToggle}
              >
                {isEditing ? 'Save Changes' : 'Edit Profile'}
              </Button>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );

  const renderAboutSection = () => (
    <>
      <Typography variant="h6" gutterBottom>About</Typography>
      {isEditing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            value={profileData?.bio || ''}
            onChange={(e) => handleProfileUpdate({ bio: e.target.value })}
            placeholder="Tell us about yourself..."
          />
          <LocationAutocomplete
            value={profileData?.location || ''}
            onChange={(location) => handleProfileUpdate({ location })}
          />
        </Box>
      ) : (
        <Typography paragraph>
          {profileData?.bio || 'No bio added yet.'}
        </Typography>
      )}
    </>
  );

  const renderEducationSection = () => {
    if (!profileData || profileData.userType !== 'athlete' || !profileData.athleteInfo?.academicInfo) return null;

    const { athleteInfo } = profileData;
    const { academicInfo } = athleteInfo;

    return (
      <>
        <Typography variant="h6" gutterBottom>Education</Typography>
        {isEditing ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="School"
              value={academicInfo.currentSchool || ''}
              onChange={(e) => handleAthleteInfoChange('academicInfo', {
                ...academicInfo,
                currentSchool: e.target.value
              })}
            />
            <TextField
              fullWidth
              label="Graduation Year"
              type="number"
              value={academicInfo.graduationYear || ''}
              onChange={(e) => handleAthleteInfoChange('academicInfo', {
                ...academicInfo,
                graduationYear: e.target.value
              })}
            />
          </Box>
        ) : (
          <List>
            <ListItem>
              <ListItemIcon><School /></ListItemIcon>
              <ListItemText
                primary={academicInfo.currentSchool || 'Add your school'}
                secondary={`Class of ${academicInfo.graduationYear || 'Not specified'}`}
              />
            </ListItem>
          </List>
        )}
      </>
    );
  };

  const renderAthleteFields = () => {
    if (!profileData || profileData.userType !== 'athlete') return null;

    const athleteInfo = profileData.athleteInfo || defaultAthleteInfo;

    return (
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Sport"
                value={athleteInfo.sports[0].sport}
                onChange={(e) => handleAthleteInfoChange('sports', [
                  { ...athleteInfo.sports[0], sport: e.target.value }
                ])}
              />
              <TextField
                fullWidth
                label="Position"
                value={athleteInfo.sports[0].position}
                onChange={(e) => handleAthleteInfoChange('sports', [
                  { ...athleteInfo.sports[0], position: e.target.value }
                ])}
              />
              <TextField
                fullWidth
                label="Level"
                value={athleteInfo.sports[0].level}
                onChange={(e) => handleAthleteInfoChange('sports', [
                  { ...athleteInfo.sports[0], level: e.target.value }
                ])}
              />
              <TextField
                fullWidth
                type="number"
                label="Years of Experience"
                value={athleteInfo.sports[0].experience}
                onChange={(e) => handleAthleteInfoChange('sports', [
                  { ...athleteInfo.sports[0], experience: Number(e.target.value) }
                ])}
              />
            </Box>
          ) : (
            <List disablePadding>
              <ListItem>
                <ListItemIcon><Sports /></ListItemIcon>
                <ListItemText 
                  primary="Sport"
                  secondary={athleteInfo.sports[0].sport || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Assignment /></ListItemIcon>
                <ListItemText 
                  primary="Position"
                  secondary={athleteInfo.sports[0].position || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><TrendingUp /></ListItemIcon>
                <ListItemText 
                  primary="Level"
                  secondary={athleteInfo.sports[0].level || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><Timeline /></ListItemIcon>
                <ListItemText 
                  primary="Experience"
                  secondary={`${athleteInfo.sports[0].experience || 0} years`}
                />
              </ListItem>
            </List>
          )}
        </Grid>

        {/* Academic Information */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Academic Information</Typography>
          {isEditing ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="School"
                value={athleteInfo.academicInfo.currentSchool || ''}
                onChange={(e) => handleAthleteInfoChange('academicInfo', {
                  ...athleteInfo.academicInfo,
                  currentSchool: e.target.value
                })}
              />
              <TextField
                fullWidth
                label="Graduation Year"
                value={athleteInfo.academicInfo.graduationYear || ''}
                onChange={(e) => handleAthleteInfoChange('academicInfo', {
                  ...athleteInfo.academicInfo,
                  graduationYear: e.target.value
                })}
              />
            </Box>
          ) : (
            <List disablePadding>
              <ListItem>
                <ListItemIcon><School /></ListItemIcon>
                <ListItemText
                  primary="Current School"
                  secondary={athleteInfo.academicInfo.currentSchool || 'Not specified'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon><CalendarMonth /></ListItemIcon>
                <ListItemText
                  primary="Graduation Year"
                  secondary={athleteInfo.academicInfo.graduationYear || 'Not specified'}
                />
              </ListItem>
            </List>
          )}
        </Grid>

        {/* Achievements Section */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>Achievements</Typography>
          {athleteInfo.achievements && athleteInfo.achievements.length > 0 ? (
            <List disablePadding>
              {athleteInfo.achievements.map((achievement, index) => (
                <ListItem key={index}>
                  <ListItemIcon><EmojiEvents /></ListItemIcon>
                  <ListItemText primary={achievement} />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary">No achievements added yet</Typography>
          )}
        </Grid>
      </Grid>
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

  const renderCollegeInfo = (collegeInfo: CollegeInfo) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        College Information
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <School />
          </ListItemIcon>
          <ListItemText
            primary="College Name"
            secondary={collegeInfo.name || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <LocationOn />
          </ListItemIcon>
          <ListItemText
            primary="Location"
            secondary={collegeInfo.location || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Category />
          </ListItemIcon>
          <ListItemText
            primary="Division"
            secondary={collegeInfo.division || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Group />
          </ListItemIcon>
          <ListItemText
            primary="Conference"
            secondary={collegeInfo.conference || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <SportsSoccer />
          </ListItemIcon>
          <ListItemText
            primary="Sports"
            secondary={collegeInfo.sports.join(', ') || 'None'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Groups />
          </ListItemIcon>
          <ListItemText
            primary="Teams"
            secondary={collegeInfo.teams.map(team => team.name).join(', ') || 'None'}
          />
        </ListItem>
      </List>
    </Box>
  );

  const renderSponsorInfo = (sponsorInfo: SponsorInfo) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Sponsor Information
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <Business />
          </ListItemIcon>
          <ListItemText
            primary="Company Name"
            secondary={sponsorInfo.companyName || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Category />
          </ListItemIcon>
          <ListItemText
            primary="Industry"
            secondary={sponsorInfo.industry || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <LocalOffer />
          </ListItemIcon>
          <ListItemText
            primary="Sponsorship Types"
            secondary={sponsorInfo.sponsorshipTypes.join(', ') || 'None'}
          />
        </ListItem>
      </List>
    </Box>
  );

  const renderMediaInfo = (mediaInfo: MediaInfo) => (
    <Box>
      <Typography variant="h6" gutterBottom>
        Media Information
      </Typography>
      <List>
        <ListItem>
          <ListItemIcon>
            <Business />
          </ListItemIcon>
          <ListItemText
            primary="Company Name"
            secondary={mediaInfo.companyName || 'Not specified'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <Category />
          </ListItemIcon>
          <ListItemText
            primary="Coverage Areas"
            secondary={mediaInfo.coverageAreas?.join(', ') || 'None'}
          />
        </ListItem>
        <ListItem>
          <ListItemIcon>
            <VideoLibrary />
          </ListItemIcon>
          <ListItemText
            primary="Media Types"
            secondary={mediaInfo.mediaType?.join(', ') || 'None'}
          />
        </ListItem>
      </List>
    </Box>
  );

  const renderTypeSpecificInfo = () => {
    if (!profileData) return null;

    switch (profileData.userType) {
      case 'athlete':
        if (!profileData.athleteInfo) return null;
        return renderAthleteFields();
      case 'coach':
        if (!profileData.coachInfo) return null;
        return renderCoachFields();
      case 'college':
        if (!profileData.collegeInfo) return null;
        return renderCollegeInfo(profileData.collegeInfo);
      case 'sponsor':
        if (!profileData.sponsorInfo) return null;
        return renderSponsorInfo(profileData.sponsorInfo);
      case 'media':
        if (!profileData.mediaInfo) return null;
        return renderMediaInfo(profileData.mediaInfo);
      default:
        return null;
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

  return (
    <>
      <Header />
      <Box sx={{ pt: 8 }}>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          {renderProfileHeader()}
          
          {/* Tabs */}
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="profile tabs"
              variant="fullWidth"
            >
              <Tab label="About" />
              <Tab label="Posts" />
            </Tabs>
          </Paper>

          {/* Tab Panels */}
          <TabPanel value={activeTab} index={0}>
            <Grid container spacing={3}>
              {/* Left column - Profile details */}
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  {renderAboutSection()}
                </Paper>
                <Paper sx={{ p: 3, mb: 3 }}>
                  {renderTypeSpecificInfo()}
                </Paper>
                <Paper sx={{ p: 3 }}>
                  {renderEducationSection()}
                </Paper>
              </Grid>
              
              {/* Right column - Social links */}
              <Grid item xs={12} md={4}>
                <Paper sx={{ p: 3, height: 'fit-content' }}>
                  <Typography variant="h6" gutterBottom>Social Links</Typography>
                  <List>
                    {renderSocialLinks()}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            {/* Create Post Button */}
            {isOwnProfile && (
              <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenPostDialog(true)}
                  sx={{ px: 3 }}
                >
                  Create New Post
                </Button>
              </Box>
            )}

            {/* Posts Tab Content */}
            <PostsTab {...postsTabProps} />
          </TabPanel>

          {/* Create Post Dialog */}
          <Dialog
            open={openPostDialog}
            onClose={handlePostDialogClose}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Create New Post</DialogTitle>
            <DialogContent>
              <TextField
                autoFocus
                margin="dense"
                fullWidth
                multiline
                rows={4}
                placeholder="What's on your mind?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              {/* Media Preview */}
              {postMediaPreviews.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {postMediaPreviews.map((preview, index) => (
                    <Box
                      key={index}
                      sx={{ position: 'relative' }}
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        style={{ width: 100, height: 100, objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          bgcolor: 'background.paper'
                        }}
                        onClick={() => handleRemoveMedia(index)}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                style={{ display: 'none' }}
                ref={postMediaInputRef}
                onChange={handlePostMediaSelect}
              />
              <Button
                onClick={() => postMediaInputRef.current?.click()}
                startIcon={<Image />}
              >
                Add Media
              </Button>
              <Box sx={{ flex: 1 }} />
              <Button onClick={handlePostDialogClose}>Cancel</Button>
              <Button
                onClick={handleCreatePost}
                variant="contained"
                disabled={!newPostContent.trim() || isPostingLoading}
              >
                {isPostingLoading ? 'Posting...' : 'Post'}
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </>
  );
};

export default Profile; 