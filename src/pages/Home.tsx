import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  CircularProgress,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Comment as CommentIcon,
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
  SendOutlined,
  EditOutlined,
  DeleteOutline,
  AttachFile,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import Header from '../components/layout/Header';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { getFeed, addReaction, removeReaction, addComment, sharePost, createPost, updatePost, deletePost } from '../services/post.service';
import type { PostWithAuthor, Comment as PostComment, Reaction, ReactionType } from '../types/post';
import { useSnackbar } from 'notistack';
import { Timestamp, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import { getUserProfile } from '../services/user.service';
import { getUserSuggestions, connectWithUser } from '../services/user.service';
import { UserProfile } from '../types/user';
import { v4 as uuidv4 } from 'uuid';
import DeleteDialog from '../components/DeleteDialog';
import { emitPostDeleted } from '../events/postEvents';

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
  sponsor: [
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

// Add these type definitions at the top level
interface PerformanceMetrics {
  [key: string]: number;
}

interface AthleteStats {
  sport: string;
}

interface AthleteInfo {
  sports: Array<AthleteStats & {
    performance?: PerformanceMetrics;
  }>;
  activities?: string[];
}

interface UserInterests {
  interests: string[];
}

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
      case 'sponsor':
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
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<File[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showCommentInput, setShowCommentInput] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentUsers, setCommentUsers] = useState<Map<string, { displayName: string, photoURL?: string }>>(new Map());
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    const loadPosts = async () => {
      if (!user?.uid) {
        console.error('No user ID available for loading posts');
        return;
      }

      try {
        setLoading(true);
        console.log('Loading posts for user:', user.uid);
        const { posts: newPosts, lastVisible: last, hasMore } = await getFeed(user.uid);
        
        // Validate posts before setting state
        const validPosts = newPosts.filter(post => {
          if (!post.id) {
            console.error('Invalid post data - missing ID:', post);
            return false;
          }
          if (!post.author?.uid) {
            console.error('Invalid post data - missing author:', post);
            return false;
          }
          return true;
        });

        console.log('Loaded valid posts:', validPosts.length);
        console.log('Post details:', validPosts.map(p => ({ id: p.id, authorId: p.author.uid })));
        setPosts(validPosts);
        setLastVisible(last);
        setHasMore(hasMore);
      } catch (error) {
        console.error('Error loading posts:', error);
        enqueueSnackbar('Failed to load posts. Please try refreshing the page.', { 
          variant: 'error',
          autoHideDuration: 5000
        });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [user?.uid, enqueueSnackbar, posts.length === 0]);

  const renderPostContent = (post: PostWithAuthor) => {
    const mediaItems = post.media || [];
    
    return (
      <>
        <Typography 
          variant="body1" 
          paragraph
          sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}
        >
          {post.content}
        </Typography>
        {mediaItems.length > 0 && (
          <Box sx={{ mt: 2, mb: 2 }}>
            {mediaItems.map((mediaItem, index) => (
              <Box
                key={mediaItem.id}
                sx={{
                  width: '100%',
                  mb: index < mediaItems.length - 1 ? 2 : 0
                }}
              >
                {mediaItem.type === 'video' ? (
                  <video
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '500px',
                      borderRadius: 8,
                      backgroundColor: '#000'
                    }}
                  >
                    <source src={mediaItem.url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={mediaItem.url}
                    alt={mediaItem.filename || `Post media ${index + 1}`}
                    style={{
                      width: '100%',
                      maxHeight: '500px',
                      objectFit: 'contain',
                      borderRadius: 8
                    }}
                    loading="lazy"
                  />
                )}
              </Box>
            ))}
          </Box>
        )}
      </>
    );
  };

  const handleReaction = async (postId: string) => {
    if (!user) {
      enqueueSnackbar('Please sign in to react to posts', { variant: 'warning' });
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const existingReaction = post.reactions?.find(r => r.userId === user.uid && r.type === 'like');

      if (existingReaction) {
        await removeReaction(postId, user.uid);
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === postId 
            ? { ...p, reactions: (p.reactions || []).filter(r => !(r.userId === user.uid && r.type === 'like')) }
            : p
        ));
      } else {
        await addReaction(postId, user.uid, 'like' as ReactionType);
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === postId 
            ? { ...p, reactions: [...(p.reactions || []), { userId: user.uid, type: 'like' as ReactionType, createdAt: Timestamp.now() }] }
            : p
        ));
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      enqueueSnackbar('Failed to update reaction', { variant: 'error' });
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user || !commentContent.trim()) return;

    try {
      await addComment(postId, user.uid, commentContent);
      
      setPosts(prevPosts => prevPosts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              comments: [...p.comments, {
                id: uuidv4(),
                userId: user.uid,
                content: commentContent,
                createdAt: Timestamp.now(),
                isEdited: false,
                reactions: []
              } as PostComment]
            }
          : p
      ));
      
      setCommentContent('');
      setShowCommentInput(null);
      enqueueSnackbar('Comment added successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error adding comment:', error);
      enqueueSnackbar('Failed to add comment', { variant: 'error' });
    }
  };

  const handleShare = async (postId: string) => {
    if (!user) {
      enqueueSnackbar('Please sign in to share posts', { variant: 'warning' });
      return;
    }

    try {
      await sharePost(postId);
      setPosts(prevPosts => prevPosts.map(p => 
        p.id === postId 
          ? { ...p, shares: p.shares + 1 }
          : p
      ));
      enqueueSnackbar('Post shared successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error sharing post:', error);
      enqueueSnackbar('Failed to share post', { variant: 'error' });
    }
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      setSelectedMedia(prevMedia => [...prevMedia, ...files]);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia(prevMedia => prevMedia.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!user || !postContent.trim()) {
      enqueueSnackbar('Please enter some content for your post', { variant: 'warning' });
      return;
    }

    try {
      setIsPosting(true);
      console.log('Creating post with authorId:', user.uid);
      const postId = await createPost(
        user.uid,
        postContent,
        selectedMedia,
        'public'
      );

      // Get the complete user profile
      const authorProfile = await getUserProfile(user.uid);
      if (!authorProfile) {
        throw new Error('Failed to get author profile');
      }

      console.log('Author profile:', authorProfile);

      // Add the new post to the beginning of the posts array
      const newPost: PostWithAuthor = {
        id: postId,
        content: postContent,
        reactions: [],
        comments: [],
        shares: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        isEdited: false,
        visibility: 'public' as const,
        author: authorProfile,
        media: selectedMedia.map((file, index) => ({
          id: `${postId}-media-${index}`,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          url: URL.createObjectURL(file),
          path: `posts/${postId}/${file.name}`,
          filename: file.name
        }))
      };

      setPosts(prevPosts => [newPost, ...prevPosts]);
      setPostContent('');
      setSelectedMedia([]);
      enqueueSnackbar('Post created successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error creating post:', error);
      enqueueSnackbar('Failed to create post', { variant: 'error' });
    } finally {
      setIsPosting(false);
    }
  };

  const handleEditPost = async (postId: string) => {
    if (!user) return;
    
    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      await updatePost(postId, user.uid, { content: editContent });
      
      setPosts(prevPosts => prevPosts.map(p => 
        p.id === postId 
          ? { ...p, content: editContent, isEdited: true, updatedAt: Timestamp.now() }
          : p
      ));
      
      setEditingPost(null);
      setEditContent('');
      enqueueSnackbar('Post updated successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error updating post:', error);
      enqueueSnackbar('Failed to update post', { variant: 'error' });
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    if (!postId) {
      console.error('handleMenuOpen: No post ID provided');
      enqueueSnackbar('Error: Unable to perform this action', { variant: 'error' });
      return;
    }
    
    // Verify the post exists in our state
    const post = posts.find(p => p.id === postId);
    if (!post) {
      console.error('handleMenuOpen: Post not found in state:', postId);
      enqueueSnackbar('Error: Post not found', { variant: 'error' });
      return;
    }
    
    event.stopPropagation();
    console.log('handleMenuOpen called with postId:', postId);
    setSelectedPost(postId);
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPost(null);
  };

  const handleDeleteClick = (postId: string) => {
    if (!postId) {
      console.error('handleDeleteClick: No post ID provided');
      enqueueSnackbar('Error: Unable to delete post', { variant: 'error' });
      return;
    }

    // Verify the post exists and user has permission
    const post = posts.find(p => p.id === postId);
    if (!post) {
      console.error('handleDeleteClick: Post not found:', postId);
      enqueueSnackbar('Error: Post not found', { variant: 'error' });
      return;
    }

    if (!user || post.author.uid !== user.uid) {
      console.error('handleDeleteClick: Unauthorized deletion attempt');
      enqueueSnackbar('Error: You do not have permission to delete this post', { variant: 'error' });
      return;
    }

    console.log('handleDeleteClick called with postId:', postId);
    setSelectedPost(postId);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async (postId: string | null) => {
    if (!postId) {
      console.error('No post selected for deletion');
      return;
    }
    console.log('Confirming delete for post:', postId);
    
    if (!user?.uid) {
      console.error('Missing user. User:', user?.uid);
      enqueueSnackbar('Unable to delete post: User not authenticated', { variant: 'error' });
      return;
    }

    try {
      console.log('Attempting to delete post:', postId, 'by user:', user.uid);
      const post = posts.find(p => p.id === postId);
      
      if (!post) {
        console.error('Post not found:', postId);
        enqueueSnackbar('Post not found', { variant: 'error' });
        return;
      }

      // Verify ownership before attempting deletion
      if (post.author.uid !== user.uid) {
        console.error('Unauthorized deletion attempt. Post author:', post.author.uid, 'User:', user.uid);
        enqueueSnackbar('You do not have permission to delete this post', { variant: 'error' });
        return;
      }

      await deletePost(postId, user.uid);
      console.log('Post deleted successfully:', postId);
      
      // Update local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      
      // Emit post deleted event
      emitPostDeleted(postId);
      
      enqueueSnackbar('Post deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting post:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Failed to delete post', { variant: 'error' });
    } finally {
      setShowDeleteDialog(false);
      setSelectedPost(null);
      setMenuAnchorEl(null);
    }
  };

  const handleEditClick = (post: PostWithAuthor) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    handleMenuClose();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Create Post */}
      <Paper 
        key="create-post"
        sx={{ p: { xs: 3, sm: 2 }, mb: 3 }}
      >
        <Box 
          display="flex" 
          alignItems="flex-start"
          mb={2}
          sx={{
            '& .MuiAvatar-root': {
              width: { xs: 48, sm: 40 },
              height: { xs: 48, sm: 40 },
              mr: { xs: 3, sm: 2 }
            }
          }}
        >
          <Avatar 
            src={user?.photoURL} 
            alt={user?.displayName || 'User'}
            sx={{ bgcolor: 'primary.main' }}
          >
            {user?.displayName?.[0]?.toUpperCase()}
          </Avatar>
          <Box flex={1}>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder={`What's on your mind, ${user?.displayName?.split(' ')[0]}?`}
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              disabled={isPosting}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2
                }
              }}
            />
            {selectedMedia.length > 0 && (
              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {selectedMedia.map((file, index) => (
                  <Box
                    key={index}
                    sx={{
                      position: 'relative',
                      width: 100,
                      height: 100,
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    {file.type.startsWith('image/') ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Selected media ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      <video
                        src={URL.createObjectURL(file)}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                      />
                    )}
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedMedia(prev => prev.filter((_, i) => i !== index));
                      }}
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0, 0, 0, 0.5)',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(0, 0, 0, 0.7)'
                        }
                      }}
                    >
                      <DeleteOutline fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
              </Box>
            )}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleMediaSelect}
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  disabled={isPosting}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPosting}
                  size={isMobile ? "large" : "medium"}
                >
                  <AttachFile />
                </IconButton>
              </Box>
              <Button
                variant="contained"
                onClick={handleCreatePost}
                disabled={!postContent.trim() && selectedMedia.length === 0 || isPosting}
                sx={{
                  px: { xs: 4, sm: 3 },
                  py: { xs: 1.5, sm: 1 },
                  borderRadius: 2
                }}
              >
                {isPosting ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Pinned/Announcements Section */}
      <Paper 
        key="announcements"
        sx={{ p: 2, mb: 3, bgcolor: 'action.hover' }}
      >
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
        {user?.userType === 'sponsor' && 'Sponsorship Analytics & Requests'}
      </Typography>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Paper 
          key="no-posts"
          sx={{ p: 3, textAlign: 'center' }}
        >
          <Typography variant="body1" color="text.secondary">
            No posts to show. Start following people or connect with others to see their updates!
          </Typography>
        </Paper>
      ) : (
        posts.map((post) => {
          // Validate post data
          if (!post?.id || !post?.author?.uid) {
            console.error('Invalid post data:', post);
            return null;
          }

          return (
            <Paper 
              key={`post-${post.id}`}
              sx={{ p: { xs: 3, sm: 2 }, mb: 3 }}
            >
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
                <Avatar 
                  src={post.author.photoURL} 
                  alt={post.author.displayName}
                  sx={{ bgcolor: 'primary.main' }}
                >
                  {post.author.displayName?.[0]?.toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Box display="flex" alignItems="center">
                    <Typography 
                      variant="subtitle1"
                      sx={{ fontSize: { xs: '1.1rem', sm: '1rem' } }}
                    >
                      {post.author.displayName}
                    </Typography>
                    {post.author.verified && (
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
                    {new Date(post.createdAt.toDate()).toLocaleString()} • {post.author.userType}
                    {post.isEdited && ' • Edited'}
                  </Typography>
                </Box>
                {user && post.author.uid === user.uid && (
                  <Box component="span" sx={{ ml: 'auto' }}>
                    <IconButton 
                      onClick={(e) => handleMenuOpen(e, post.id)}
                      size={isMobile ? "large" : "small"}
                    >
                      <MoreVert />
                    </IconButton>
                    <Menu
                      anchorEl={menuAnchorEl}
                      open={Boolean(menuAnchorEl) && selectedPost === post.id}
                      onClose={handleMenuClose}
                    >
                      <MenuItem onClick={() => handleEditClick(post)}>
                        <EditOutlined sx={{ mr: 1 }} /> Edit
                      </MenuItem>
                      <MenuItem onClick={() => handleDeleteClick(post.id)}>
                        <DeleteOutline sx={{ mr: 1 }} /> Delete
                      </MenuItem>
                    </Menu>
                  </Box>
                )}
              </Box>
              {/* Post Content */}
              {editingPost === post.id ? (
                <Box sx={{ mt: 2, mb: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    variant="outlined"
                  />
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <Button 
                      onClick={() => {
                        setEditingPost(null);
                        setEditContent('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="contained" 
                      onClick={() => handleEditPost(post.id)}
                      disabled={!editContent.trim() || editContent === post.content}
                    >
                      Save
                    </Button>
                  </Box>
                </Box>
              ) : (
                <>
                  {renderPostContent(post)}
                </>
              )}
              {/* Rest of the post rendering */}
            </Paper>
          );
        })
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => {
          console.log('Dialog closed');
          setShowDeleteDialog(false);
          setSelectedPost(null);
          setMenuAnchorEl(null);
        }}
        onConfirm={() => {
          console.log('Delete confirmation received for post:', selectedPost);
          handleConfirmDelete(selectedPost);
        }}
        title="Delete Post"
        content="Are you sure you want to delete this post? This action cannot be undone."
      />

      {/* Tips & Insights Section */}
      <Paper 
        key="tips-insights"
        sx={{ p: 2, mb: 3 }}
      >
        <Box display="flex" alignItems="center" mb={1}>
          <Lightbulb color="warning" sx={{ mr: 1 }} />
          <Typography variant="h6">Tips & Insights</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {user?.userType === 'athlete' && 'Training tips and performance insights'}
          {user?.userType === 'coach' && 'Recruiting strategies and athlete development'}
          {user?.userType === 'team' && 'Team management and event planning'}
          {user?.userType === 'sponsor' && 'Sponsorship opportunities and brand growth'}
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
  const [suggestedUsers, setSuggestedUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const loadSuggestions = useCallback(async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      console.log('Loading suggestions for user:', user.uid);
      const suggestions = await getUserSuggestions(user.uid);
      console.log('Loaded suggestions:', suggestions);
      setSuggestedUsers(suggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      enqueueSnackbar('Failed to load suggestions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [user, enqueueSnackbar]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleConnect = async (targetUserId: string) => {
    if (!user?.uid) return;
    try {
      await connectWithUser(user.uid, targetUserId);
      setSuggestedUsers(prev => prev.filter(u => u.uid !== targetUserId));
      enqueueSnackbar('Connection request sent', { variant: 'success' });
    } catch (error) {
      console.error('Error connecting with user:', error);
      enqueueSnackbar('Failed to send connection request', { variant: 'error' });
    }
  };

  const getSimilarityInfo = (suggestedUser: UserProfile) => {
    const similarities: string[] = [];
    const matchScore: { [key: string]: number } = {
      sports: 0,
      location: 0,
      activities: 0,
      performance: 0
    };

    // Check for common sports
    if (user?.athleteInfo && suggestedUser.athleteInfo) {
      const userSports = user.athleteInfo.sports.map(s => s.sport.toLowerCase());
      const suggestedSports = suggestedUser.athleteInfo.sports.map(s => s.sport.toLowerCase());
      const commonSports = userSports.filter(sport => suggestedSports.includes(sport));
      
      if (commonSports.length > 0) {
        similarities.push(`Same sport: ${commonSports[0]}`);
        matchScore.sports = (commonSports.length / Math.max(userSports.length, suggestedSports.length)) * 100;
      }

      // Check for similar performance within the same sport
      const commonSportPerformance = commonSports.filter(sport => {
        const userSport = user.athleteInfo?.sports.find(s => s.sport.toLowerCase() === sport) as (AthleteStats & { performance?: PerformanceMetrics });
        const suggestedSport = suggestedUser.athleteInfo?.sports.find(s => s.sport.toLowerCase() === sport) as (AthleteStats & { performance?: PerformanceMetrics });
        
        if (!userSport?.performance || !suggestedSport?.performance) return false;
        
        // Calculate average performance
        const userPerf = Object.values(userSport.performance) as number[];
        const suggestedPerf = Object.values(suggestedSport.performance) as number[];
        
        const userAvg = userPerf.reduce((a, b) => a + b, 0) / userPerf.length;
        const suggestedAvg = suggestedPerf.reduce((a, b) => a + b, 0) / suggestedPerf.length;
        
        // Consider performance similar if they're within 20% of each other
        return Math.abs(userAvg - suggestedAvg) / userAvg < 0.2;
      });

      if (commonSportPerformance.length > 0) {
        similarities.push(`Similar performance in ${commonSportPerformance[0]}`);
        matchScore.performance = (commonSportPerformance.length / commonSports.length) * 100;
      }
    }

    // Check for location proximity
    if (user?.location && suggestedUser.location) {
      const isSameLocation = user.location.toLowerCase() === suggestedUser.location.toLowerCase();
      if (isSameLocation) {
        similarities.push(`Same location: ${suggestedUser.location}`);
        matchScore.location = 100;
      }
    }

    // Check for common activities
    if (user?.athleteInfo?.activities && suggestedUser.athleteInfo?.activities) {
      const userActivities = user.athleteInfo.activities;
      const suggestedActivities = suggestedUser.athleteInfo.activities;
      const commonActivities = userActivities.filter(activity => suggestedActivities.includes(activity));
      
      if (commonActivities.length > 0) {
        similarities.push(`Similar activities: ${commonActivities[0]}`);
        matchScore.activities = (commonActivities.length / Math.max(userActivities.length, suggestedActivities.length)) * 100;
      }
    }

    // Calculate overall match percentage
    const totalScore = Object.values(matchScore).reduce((sum, score) => sum + score, 0);
    const averageScore = totalScore / Object.keys(matchScore).length;
    const matchPercentage = Math.round(averageScore);

    // Return the most relevant similarity with match percentage
    if (similarities.length > 0) {
      return `${similarities[0]} • ${matchPercentage}% Match`;
    }

    return `${suggestedUser.userType} • New Connection`;
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress size={24} />
            </Box>
          ) : suggestedUsers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No suggestions available at the moment. Complete your profile to get better matches!
            </Typography>
          ) : (
            <List>
              {suggestedUsers.map((profile) => (
                <ListItem
                  key={profile.uid}
                  onClick={() => navigate(`/view-profile/${profile.uid}`)}
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
                >
                  <ListItemAvatar>
                    <Avatar 
                      src={profile.photoURL} 
                      alt={profile.displayName}
                      sx={{ bgcolor: 'primary.main' }}
                    >
                      {profile.displayName[0]?.toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center">
                      <Typography noWrap>
                        {profile.displayName}
                      </Typography>
                      {profile.verified && (
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
                      {getSimilarityInfo(profile)}
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
                      handleConnect(profile.uid);
                    }}
                  >
                    Connect
                  </Button>
                </ListItem>
              ))}
            </List>
          )}
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
              onClick={() => navigate('/view-profile/user1')}
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