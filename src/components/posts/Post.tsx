import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { formatDistanceToNow } from 'date-fns';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  EditOutlined,
  DeleteOutline,
  ThumbUpOutlined,
  CommentOutlined,
  RepeatOutlined,
  BookmarkOutlined,
  BookmarkBorderOutlined,
  Verified,
  LockOutlined,
} from '@mui/icons-material';
import { RootState } from '../../store/store';
import { PostWithAuthor, ReactionType } from '../../types/post';

export interface PostProps {
  post: PostWithAuthor;
  isOwnPost: boolean;
  onDelete: () => Promise<void>;
  onEdit: () => Promise<void>;
  onReaction: (type: ReactionType) => Promise<void>;
}

const Post: React.FC<PostProps> = ({ post, isOwnPost, onDelete, onEdit, onReaction }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = async () => {
    try {
      console.log('Post component - Delete clicked for post:', post.id);
      await onDelete();
      handleMenuClose();
    } catch (error) {
      console.error('Error in Post component delete handler:', error);
    }
  };

  const handleEdit = async () => {
    try {
      await onEdit();
      handleMenuClose();
    } catch (error) {
      console.error('Error in Post component edit handler:', error);
    }
  };

  const formatContent = (content: string) => {
    return content;
  };

  const renderReactionSummary = () => {
    const reactionCounts = post.reactions.reduce((acc: Record<string, number>, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(reactionCounts).map(([type, count]) => (
      <Typography key={type} variant="body2" color="text.secondary" component="span">
        {count} {type}
        {count > 1 ? 's' : ''} •{' '}
      </Typography>
    ));
  };

  if (!currentUser) return null;

  return (
    <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1, mb: 2 }}>
      {/* Post Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Link to={`/profile/${post.author.uid}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <Box display="flex" alignItems="center">
            <Avatar
              src={post.author.photoURL || undefined}
              alt={post.author.displayName}
              sx={{ width: 40, height: 40, mr: 1 }}
            />
            <Box>
              <Box display="flex" alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                  {post.author.displayName}
                </Typography>
                {post.author.verified && (
                  <Tooltip title="Verified Account">
                    <Verified color="primary" sx={{ ml: 0.5, width: 16, height: 16 }} />
                  </Tooltip>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(post.createdAt.toDate(), { addSuffix: true })}
                {post.isEdited && ' • Edited'}
              </Typography>
            </Box>
          </Box>
        </Link>
        {isOwnPost && (
          <>
            <IconButton onClick={handleMenuClick}>
              <MoreVertIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={handleEdit}>
                <EditOutlined sx={{ mr: 1 }} /> Edit
              </MenuItem>
              <MenuItem onClick={handleDelete}>
                <DeleteOutline sx={{ mr: 1 }} /> Delete
              </MenuItem>
            </Menu>
          </>
        )}
      </Box>

      {/* Post Content */}
      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
        {post.content}
      </Typography>

      {/* Post Media */}
      {post.media && post.media.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {post.media.map((media, index) => (
            media.type === 'video' ? (
              <video
                key={media.id}
                controls
                style={{
                  maxWidth: '100%',
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: '#000'
                }}
              >
                <source src={media.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                key={media.id}
                src={media.url}
                alt={`Post media ${index + 1}`}
                style={{ maxWidth: '100%', borderRadius: 8, marginBottom: 8 }}
                loading="lazy"
              />
            )
          ))}
        </Box>
      )}

      {/* Reactions and Stats */}
      <Box sx={{ mb: 2 }}>
        {renderReactionSummary()}
        <Typography variant="body2" color="text.secondary">
          {post.comments.length} comments • {post.shares} shares
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Post Actions */}
      <Box display="flex" alignItems="center" gap={2}>
        <Button
          startIcon={<ThumbUpOutlined />}
          onClick={() => onReaction('like')}
          color={post.reactions.some(r => r.userId === currentUser.uid && r.type === 'like') ? 'primary' : 'inherit'}
        >
          Like {post.reactions.length > 0 && `(${post.reactions.length})`}
        </Button>
        <Button
          startIcon={<CommentOutlined />}
          color="inherit"
        >
          Comment {post.comments.length > 0 && `(${post.comments.length})`}
        </Button>
        <Button
          startIcon={<RepeatOutlined />}
          color="inherit"
        >
          Share {post.shares > 0 && `(${post.shares})`}
        </Button>
      </Box>
    </Box>
  );
};

export default Post; 