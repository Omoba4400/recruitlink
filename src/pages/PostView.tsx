import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, CircularProgress, Typography } from '@mui/material';
import { useSnackbar } from 'notistack';
import Header from '../components/layout/Header';
import Post from '../components/posts/Post';
import { getPost } from '../services/post.service';
import { PostWithAuthor } from '../types/post';

const PostView: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [post, setPost] = useState<PostWithAuthor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPost = async () => {
      if (!postId) return;

      try {
        setLoading(true);
        const fetchedPost = await getPost(postId);
        if (fetchedPost) {
          setPost(fetchedPost);
        } else {
          enqueueSnackbar('Post not found', { variant: 'error' });
          navigate('/home');
        }
      } catch (error) {
        console.error('Error loading post:', error);
        enqueueSnackbar('Failed to load post', { variant: 'error' });
        navigate('/home');
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, navigate, enqueueSnackbar]);

  return (
    <>
      <Header />
      <Container maxWidth="md" sx={{ mt: 10, mb: 4 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : !post ? (
          <Typography variant="h6" align="center" color="text.secondary">
            Post not found
          </Typography>
        ) : (
          <Post
            post={post}
            isOwnPost={false}
            onDelete={() => Promise.resolve()}
            onEdit={() => Promise.resolve()}
            onReaction={(type) => Promise.resolve()}
          />
        )}
      </Container>
    </>
  );
};

export default PostView; 