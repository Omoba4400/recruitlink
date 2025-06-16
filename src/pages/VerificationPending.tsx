import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Container, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import { RootState } from '../store/store';
import { setUser } from '../store/slices/authSlice';
import { checkEmailVerification, logoutUser, updateUserVerificationStep, resendVerificationEmail } from '../services/auth.service';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types/user';
import { reload } from 'firebase/auth';

const getRoleBasedRedirectPath = (userType: string): string => {
  switch (userType) {
    case 'athlete':
      return '/home';
    case 'coach':
      return '/home';
    case 'team':
      return '/profile'; // Teams should complete their profile first
    case 'sponsor':
      return '/sponsorships';
    case 'media':
      return '/home';
    case 'admin':
      return '/admin/dashboard';
    default:
      return '/home';
  }
};

const formatUserData = async (firebaseUser: typeof auth.currentUser): Promise<User> => {
  if (!firebaseUser) throw new Error('No user found');
  
  // Get user data from Firestore
  const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
  const userData = userDoc.exists() ? userDoc.data() as User : null;
  
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: userData?.photoURL || firebaseUser.photoURL || undefined,
    userType: userData?.userType || 'athlete',
    createdAt: userData?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: userData?.bio || '',
    location: userData?.location || '',
    verified: userData?.verified || false,
    blocked: userData?.blocked || false,
    emailVerified: firebaseUser.emailVerified,
    isAdmin: userData?.isAdmin || false,
    verificationStatus: userData?.verificationStatus || 'none',
    verificationStep: userData?.verificationStep || 'email',
    privacySettings: userData?.privacySettings || {
      profileVisibility: 'public',
      allowMessagesFrom: 'everyone',
      showEmail: true,
      showLocation: true,
      showAcademicInfo: true,
      showAthleteStats: true
    },
    socialLinks: userData?.socialLinks || {
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: ''
    },
    followers: userData?.followers || [],
    following: userData?.following || [],
    connections: userData?.connections || [],
    phoneVerified: userData?.phoneVerified || false
  };
};

const VerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const authLoading = useSelector((state: RootState) => state.auth.loading);
  const initializing = useSelector((state: RootState) => state.auth.initializing);

  const checkEmailVerification = async () => {
    if (!user || !auth.currentUser) return false;

    try {
      setVerifying(true);
      // Reload the user to get fresh email verification status
      await reload(auth.currentUser);
      const isVerified = auth.currentUser.emailVerified;

      if (isVerified && !user.emailVerified) { // Only update if state hasn't been updated yet
        // Update user verification step to phone
        await updateUserVerificationStep(user.uid, 'phone');
        
        // Create updated user object with correct type
        const updatedUser: User = {
          ...user,
          emailVerified: true,
          verificationStep: 'phone'
        };
        
        dispatch(setUser(updatedUser));
        
        // Show success message and navigate only on the first verification
        enqueueSnackbar('Email verified successfully!', { 
          variant: 'success',
          preventDuplicate: true // Prevent duplicate notifications
        });
        navigate('/verify-phone');
        return true;
      }
      return isVerified;
    } catch (error) {
      console.error('Error checking email verification:', error);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const initializeVerification = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      // Initial check
      const isVerified = await checkEmailVerification();
      setLoading(false);

      if (!isVerified) {
        // Set up polling every 5 seconds only if not verified
        interval = setInterval(async () => {
          const verified = await checkEmailVerification();
          if (verified) {
            clearInterval(interval);
          }
        }, 5000);
      }
    };

    initializeVerification();

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [user]);

  const handleResendVerificationEmail = async () => {
    try {
      setResendDisabled(true);
      const result = await resendVerificationEmail();
      if (result.verified) {
        enqueueSnackbar('Your email is already verified!', { 
          variant: 'success',
          autoHideDuration: 4000
        });
        await checkEmailVerification();
        return;
      }
      if (result.sent) {
        enqueueSnackbar('Verification email sent! Please check your inbox.', { 
          variant: 'success',
          autoHideDuration: 4000
        });
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      enqueueSnackbar(error instanceof Error ? error.message : 'Failed to send verification email', {
        variant: 'error',
        autoHideDuration: 6000
      });
    } finally {
      // Re-enable after 60 seconds
      setTimeout(() => setResendDisabled(false), 60000);
    }
  };

  if (initializing) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Verify Your Email
        </Typography>
        <Alert severity="info" sx={{ mb: 3 }}>
          A verification link has been sent to your email address: {user?.email}
        </Alert>
        <Typography paragraph>
          Please check your email and click the verification link to continue.
          Once verified, you'll be automatically redirected to the next step.
        </Typography>
        <Box mt={3} mb={2}>
          <Typography variant="body2" color="textSecondary">
            Haven't received the email? Check your spam folder or click below to resend.
          </Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Button
            variant="contained"
            color="primary"
            onClick={handleResendVerificationEmail}
            disabled={resendDisabled}
          >
            Resend Verification Email
          </Button>
          {resendDisabled && (
            <Typography variant="body2" color="textSecondary">
              Please wait 60 seconds before requesting another email
            </Typography>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default VerificationPending; 