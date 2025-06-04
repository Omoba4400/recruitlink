import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { UserProfile } from '../../types/user';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface VerificationRequest extends UserProfile {
  verificationDocuments: {
    studentId?: string;
    athleteId?: string;
    otherDocuments?: string[];
  };
  verificationInfo?: string;
}

const VerificationDashboard: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    console.log('VerificationDashboard - Auth state:', {
      isAdmin,
      authLoading,
      currentPath: window.location.pathname
    });
  }, [isAdmin, authLoading]);

  const fetchVerificationRequests = async () => {
    try {
      setIsLoading(true);
      console.log('Starting verification requests fetch:', {
        isAdmin,
        authLoading
      });
      
      if (!isAdmin) {
        console.log('Fetch aborted: Not admin');
        throw new Error('Unauthorized: Admin access required');
      }

      // Fetch verification requests
      const verificationQuery = query(
        collection(db, 'verifications'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );
      
      console.log('Executing verification query...');
      const verificationSnapshot = await getDocs(verificationQuery);
      console.log('Verification query results:', {
        size: verificationSnapshot.size,
        empty: verificationSnapshot.empty
      });
      
      if (verificationSnapshot.empty) {
        console.log('No pending verification requests found');
        setRequests([]);
        setFetchError(null);
        return;
      }

      // Get all unique user IDs from verification requests
      const userIds = Array.from(new Set(
        verificationSnapshot.docs
          .map(doc => doc.data().userId)
          .filter(id => id !== undefined)
      ));

      console.log('Found user IDs:', userIds);

      if (userIds.length === 0) {
        console.log('No valid user IDs found in verification requests');
        setRequests([]);
        setFetchError(null);
        return;
      }

      // Fetch all user data in one query
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', 'in', userIds)
      );
      
      console.log('Fetching user data...');
      const usersSnapshot = await getDocs(usersQuery);
      console.log('Users query results:', {
        size: usersSnapshot.size,
        empty: usersSnapshot.empty
      });
      
      // Create a map of user data for quick lookup
      const userDataMap = new Map(
        usersSnapshot.docs.map(doc => [doc.data().uid, doc.data()])
      );

      // Combine verification and user data
      const requestsData: VerificationRequest[] = verificationSnapshot.docs
        .map(doc => {
          const verificationData = doc.data();
          if (!verificationData.userId) {
            console.log('Verification request missing userId:', doc.id);
            return null;
          }
          
          const userData = userDataMap.get(verificationData.userId);
          if (!userData) {
            console.log('User data not found for userId:', verificationData.userId);
            return null;
          }

          return {
            ...userData,
            verificationDocuments: verificationData.documents || {},
            verificationInfo: verificationData.info,
            verificationId: doc.id,
            uid: userData.uid,
            createdAt: verificationData.createdAt || userData.createdAt
          } as VerificationRequest;
        })
        .filter((request): request is VerificationRequest => request !== null);

      console.log('Final processed requests:', {
        count: requestsData.length,
        requests: requestsData
      });
      
      setRequests(requestsData);
      setFetchError(null);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      setFetchError(error instanceof Error ? error.message : 'Failed to load verification requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch data when auth is initialized and we are admin
    if (!authLoading && isAdmin) {
      fetchVerificationRequests();
    }
  }, [authLoading, isAdmin]);

  // Show loading state while auth is initializing
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show message if not admin
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You do not have permission to access this page
        </Alert>
      </Box>
    );
  }

  const handleViewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleApprove = async (request: VerificationRequest) => {
    try {
      setProcessingAction(true);
      // Update user verification status
      const userRef = doc(db, 'users', request.uid);
      await updateDoc(userRef, {
        verified: true,
        updatedAt: new Date().toISOString(),
      });

      // Update verification request status
      const verificationQuery = query(
        collection(db, 'verifications'),
        where('userId', '==', request.uid),
        where('status', '==', 'pending')
      );
      const verificationDocs = await getDocs(verificationQuery);
      
      if (!verificationDocs.empty) {
        await updateDoc(doc(db, 'verifications', verificationDocs.docs[0].id), {
          status: 'approved',
          updatedAt: new Date().toISOString(),
          reviewedBy: auth.currentUser?.uid
        });
      }

      // Update local state
      setRequests(prev => prev.filter(r => r.uid !== request.uid));
      enqueueSnackbar('Verification request approved successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error approving verification:', error);
      enqueueSnackbar('Failed to approve verification request', { variant: 'error' });
    } finally {
      setProcessingAction(false);
      setViewDialogOpen(false);
    }
  };

  const handleReject = async (request: VerificationRequest) => {
    try {
      setProcessingAction(true);
      // Update user verification status
      const userRef = doc(db, 'users', request.uid);
      await updateDoc(userRef, {
        verified: false,
        updatedAt: new Date().toISOString(),
      });

      // Update verification request status
      const verificationQuery = query(
        collection(db, 'verifications'),
        where('userId', '==', request.uid),
        where('status', '==', 'pending')
      );
      const verificationDocs = await getDocs(verificationQuery);
      
      if (!verificationDocs.empty) {
        await updateDoc(doc(db, 'verifications', verificationDocs.docs[0].id), {
          status: 'rejected',
          updatedAt: new Date().toISOString(),
          reviewedBy: auth.currentUser?.uid
        });
      }

      // Update local state
      setRequests(prev => prev.filter(r => r.uid !== request.uid));
      enqueueSnackbar('Verification request rejected', { variant: 'info' });
    } catch (error) {
      console.error('Error rejecting verification:', error);
      enqueueSnackbar('Failed to reject verification request', { variant: 'error' });
    } finally {
      setProcessingAction(false);
      setViewDialogOpen(false);
    }
  };

  const renderVerificationDialog = () => {
    if (!selectedRequest) return null;

    return (
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={selectedRequest.photoURL || undefined}>
              {selectedRequest.displayName?.[0]}
            </Avatar>
            <Typography variant="h6">
              {selectedRequest.displayName}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>User Information</Typography>
            <Typography><strong>Email:</strong> {selectedRequest.email}</Typography>
            <Typography><strong>User Type:</strong> {selectedRequest.userType}</Typography>
            <Typography><strong>Location:</strong> {selectedRequest.location}</Typography>
            <Typography><strong>Bio:</strong> {selectedRequest.bio}</Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>Verification Documents</Typography>
            {selectedRequest.verificationDocuments?.studentId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Student ID</Typography>
                <img
                  src={selectedRequest.verificationDocuments.studentId}
                  alt="Student ID"
                  style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                />
              </Box>
            )}
            {selectedRequest.verificationDocuments?.athleteId && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2">Athlete ID</Typography>
                <img
                  src={selectedRequest.verificationDocuments.athleteId}
                  alt="Athlete ID"
                  style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain' }}
                />
              </Box>
            )}
          </Box>

          {selectedRequest.verificationInfo && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Additional Information</Typography>
              <Typography>{selectedRequest.verificationInfo}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
          <Button
            onClick={() => handleReject(selectedRequest)}
            color="error"
            disabled={processingAction}
            startIcon={processingAction ? <CircularProgress size={20} /> : <RejectIcon />}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleApprove(selectedRequest)}
            color="primary"
            variant="contained"
            disabled={processingAction}
            startIcon={processingAction ? <CircularProgress size={20} /> : <ApproveIcon />}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Verification Requests
      </Typography>

      {fetchError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fetchError}
        </Alert>
      )}

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="textSecondary">
                      No pending verification requests
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                requests.map((request) => (
                  <TableRow key={request.uid}>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar src={request.photoURL || undefined}>
                          {request.displayName?.[0]}
                        </Avatar>
                        <Typography>{request.displayName}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={request.userType}
                        size="small"
                        color="primary"
                      />
                    </TableCell>
                    <TableCell>{request.email}</TableCell>
                    <TableCell>
                      {new Date(request.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          onClick={() => handleViewRequest(request)}
                          color="primary"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reject">
                        <IconButton
                          onClick={() => handleReject(request)}
                          color="error"
                        >
                          <RejectIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Approve">
                        <IconButton
                          onClick={() => handleApprove(request)}
                          color="success"
                        >
                          <ApproveIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {renderVerificationDialog()}
    </Box>
  );
};

export default VerificationDashboard; 