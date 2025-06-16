import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Check as AcceptIcon,
  Close as RejectIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { ConnectionRequest, User } from '../../types/user';
import {
  getConnectionRequests,
  acceptConnectionRequest,
  rejectConnectionRequest,
  getUserProfile,
} from '../../services/user.service';
import { useSnackbar } from 'notistack';

const ConnectionRequests: React.FC = () => {
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [requests, setRequests] = useState<(ConnectionRequest & { sender: User })[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    const fetchRequests = async () => {
      if (!currentUser?.id) return;

      try {
        setLoading(true);
        const receivedRequests = await getConnectionRequests(currentUser.id, 'received');
        
        // Fetch sender details for each request
        const requestsWithSenders = await Promise.all(
          receivedRequests.map(async (request) => {
            const sender = await getUserProfile(request.senderId);
            return {
              ...request,
              sender: sender as User,
            };
          })
        );

        setRequests(requestsWithSenders);
      } catch (error) {
        console.error('Error fetching connection requests:', error);
        enqueueSnackbar('Failed to load connection requests', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [currentUser?.id, enqueueSnackbar]);

  const handleAccept = async (request: ConnectionRequest & { sender: User }) => {
    if (!currentUser?.id) return;

    try {
      await acceptConnectionRequest(request.id, request.senderId, currentUser.id);
      setRequests(prev => prev.filter(r => r.id !== request.id));
      enqueueSnackbar('Connection request accepted', { variant: 'success' });
    } catch (error) {
      console.error('Error accepting connection request:', error);
      enqueueSnackbar('Failed to accept connection request', { variant: 'error' });
    }
  };

  const handleReject = async (request: ConnectionRequest & { sender: User }) => {
    try {
      await rejectConnectionRequest(request.id);
      setRequests(prev => prev.filter(r => r.id !== request.id));
      enqueueSnackbar('Connection request rejected', { variant: 'info' });
    } catch (error) {
      console.error('Error rejecting connection request:', error);
      enqueueSnackbar('Failed to reject connection request', { variant: 'error' });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={2}>
        <CircularProgress />
      </Box>
    );
  }

  if (requests.length === 0) {
    return (
      <Box p={2}>
        <Typography color="textSecondary" align="center">
          No pending connection requests
        </Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Connection Requests
        </Typography>
        <List>
          {requests.map((request) => (
            <ListItem key={request.id}>
              <ListItemAvatar>
                <Avatar src={request.sender.photoURL || undefined}>
                  {request.sender.displayName?.[0]}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={request.sender.displayName}
                secondary={request.sender.userType}
              />
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  color="error"
                  onClick={() => handleReject(request)}
                >
                  <RejectIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  color="primary"
                  onClick={() => handleAccept(request)}
                >
                  <AcceptIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  );
};

export default ConnectionRequests; 