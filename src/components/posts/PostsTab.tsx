import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { Box, Typography } from '@mui/material';
import { RootState } from '../../store/store';
import { PostWithAuthor, Reaction, ReactionType } from '../../types/post';
import { getFeed, deletePost, updatePost, addReaction, removeReaction, getUserPosts } from '../../services/post.service';
import Post from './Post';
import { Timestamp, DocumentSnapshot, DocumentData } from 'firebase/firestore';
import DeleteDialog from '../../components/DeleteDialog';

const POST_LIMIT = 10;

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

interface FeedResponse {
  posts: PostWithAuthor[];
  lastVisible: DocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
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
  const lastPostRef = useRef<HTMLDivElement>(null);
  const { enqueueSnackbar } = useSnackbar();
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const response = await getUserPosts(userId);
        setPosts(response.posts);
        setLastVisible(response.lastVisible);
        setHasMorePosts(response.hasMore);
      } catch (error) {
        console.error('Error loading posts:', error);
        enqueueSnackbar('Failed to load posts', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadPosts();
  }, [userId, enqueueSnackbar]);

  const handleLoadMore = async () => {
    if (!hasMorePosts || loading || !lastVisible) return;

    try {
      setLoading(true);
      const response = await getUserPosts(userId, lastVisible);
      setPosts((prevPosts: PostWithAuthor[]) => [...prevPosts, ...response.posts]);
      setLastVisible(response.lastVisible);
      setHasMorePosts(response.hasMore);
    } catch (error) {
      console.error('Error loading more posts:', error);
      enqueueSnackbar('Failed to load more posts', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePostDelete = async () => {
    console.log('PostsTab - handlePostDelete called. Selected post:', selectedPost);
    if (!selectedPost || !user?.uid) {
      console.log('PostsTab - Missing user or selectedPost');
      return;
    }

    try {
      const post = posts.find(p => p.id === selectedPost);
      console.log('PostsTab - Found post:', post);
      
      if (!post) {
        console.log('PostsTab - Post not found');
        enqueueSnackbar('Post not found', { variant: 'error' });
        return;
      }

      if (post.author.uid !== user.uid) {
        console.log('PostsTab - Authorization failed. Post author:', post.author.uid, 'Current user:', user.uid);
        enqueueSnackbar('You are not authorized to delete this post', { variant: 'error' });
        return;
      }

      console.log('PostsTab - Calling deletePost service...');
      await deletePost(selectedPost, user.uid);
      console.log('PostsTab - Post deleted successfully in backend');

      setPosts((prevPosts: PostWithAuthor[]) => {
        console.log('PostsTab - Updating posts state. Removing post:', selectedPost);
        return prevPosts.filter(post => post.id !== selectedPost);
      });
      
      enqueueSnackbar('Post deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('PostsTab - Error deleting post:', error);
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

  const handleReaction = async (postId: string, type: ReactionType) => {
    if (!user?.uid) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      const hasReacted = post.reactions.some(r => r.userId === user.uid && r.type === type);

      if (hasReacted) {
        await removeReaction(postId, user.uid);
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === postId ? {
            ...p,
            reactions: p.reactions.filter(r => !(r.userId === user.uid && r.type === type))
          } : p
        ));
      } else {
        await addReaction(postId, user.uid, type);
        setPosts(prevPosts => prevPosts.map(p => 
          p.id === postId ? {
            ...p,
            reactions: [...p.reactions, { userId: user.uid, type, createdAt: Timestamp.now() }]
          } : p
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
    <Box>
      {posts.map((post, index) => (
        <Box key={post.id} ref={index === posts.length - 1 ? lastPostRef : null} mb={2}>
          <Post
            post={post}
            isOwnPost={post.author.uid === user?.uid}
            onDelete={async () => {
              console.log('PostsTab - Delete button clicked for post:', post.id);
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
        </Box>
      ))}
      {loading && (
        <Box textAlign="center" my={2}>
          <Typography>Loading...</Typography>
        </Box>
      )}
      {!loading && !hasMorePosts && posts.length > 0 && (
        <Box textAlign="center" my={2}>
          <Typography>No more posts</Typography>
        </Box>
      )}
      {!loading && posts.length === 0 && (
        <Box textAlign="center" my={4}>
          <Typography variant="h6" color="text.secondary">
            No posts yet
          </Typography>
        </Box>
      )}
      <DeleteDialog
        open={showDeleteDialog}
        onClose={() => {
          console.log('PostsTab - Delete dialog closed');
          setShowDeleteDialog(false);
          setSelectedPost('');
        }}
        onConfirm={() => {
          console.log('PostsTab - Delete confirmed for post:', selectedPost);
          handlePostDelete();
        }}
        title="Delete Post"
        content="Are you sure you want to delete this post? This action cannot be undone."
      />
    </Box>
  );
};

export default PostsTab; 