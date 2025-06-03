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
  Link,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Verified,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { UserProfile } from '../../types/user';
import Header from '../../components/layout/Header';

interface VerificationRequest extends UserProfile {
  verificationDocuments: {
    studentId?: string;
    athleteId?: string;
    otherDocuments?: string[];
  };
  verificationInfo?: string;
}

const VerificationDashboard: React.FC = () => {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchVerificationRequests();
  }, []);

  const fetchVerificationRequests = async () => {
    try {
      setLoading(true);
      console.log('Fetching verification requests...');
      const q = query(
        collection(db, 'users'),
        where('verificationStatus', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      console.log('Query snapshot size:', querySnapshot.size);
      const requestsData: VerificationRequest[] = [];
      
      querySnapshot.forEach((doc) => {
        console.log('Document data:', doc.id, doc.data());
        requestsData.push({
          ...doc.data(),
          uid: doc.id
        } as VerificationRequest);
      });

      console.log('Final requests data:', requestsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching verification requests:', error);
      setError('Failed to load verification requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewRequest = (request: VerificationRequest) => {
    setSelectedRequest(request);
    setViewDialogOpen(true);
  };

  const handleApprove = async (request: VerificationRequest) => {
    try {
      setProcessingAction(true);
      const userRef = doc(db, 'users', request.uid);
      await updateDoc(userRef, {
        verificationStatus: 'approved',
        verified: true,
        updatedAt: new Date().toISOString(),
      });

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
      const userRef = doc(db, 'users', request.uid);
      await updateDoc(userRef, {
        verificationStatus: 'rejected',
        verified: false,
        updatedAt: new Date().toISOString(),
      });

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

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom>
            Verification Requests
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

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
      </Container>

      {renderVerificationDialog()}
    </Box>
  );
};

export default VerificationDashboard; 