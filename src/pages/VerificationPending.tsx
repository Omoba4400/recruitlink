import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { checkEmailVerification, resendVerificationEmail, logoutUser } from '../services/auth.service';
import { setUser, updateEmailVerification } from '../store/slices/authSlice';
import { useSnackbar } from 'notistack';
import { RootState } from '../store';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../types/user';

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
    connections: userData?.connections || []
  };
};

const VerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [isChecking, setIsChecking] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVerified, setIsVerified] = useState(false);
  const currentUser = useSelector((state: RootState) => state.auth.user);

  // Check if user is already verified on mount
  useEffect(() => {
    const checkInitialVerification = async () => {
      if (!auth.currentUser) {
        navigate('/login');
        return;
      }

      // If user is already verified, redirect immediately
      if (auth.currentUser.emailVerified) {
        const userData = await formatUserData(auth.currentUser);
        dispatch(setUser(userData));
        dispatch(updateEmailVerification(true));
        const redirectPath = getRoleBasedRedirectPath(userData.userType);
        navigate(redirectPath);
        return;
      }
    };

    checkInitialVerification();
  }, [dispatch, navigate]);

  // Auto-check verification status every 5 seconds only if not verified
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkVerification = async () => {
      try {
        if (isVerified || !auth.currentUser) return;
        
        const verified = await checkEmailVerification();
        if (verified && auth.currentUser) {
          setIsVerified(true);
          const userData = await formatUserData(auth.currentUser);
          dispatch(setUser(userData));
          dispatch(updateEmailVerification(true));
          enqueueSnackbar('Email verified successfully!', { variant: 'success' });
          clearInterval(interval);
          
          const redirectPath = getRoleBasedRedirectPath(userData.userType);
          navigate(redirectPath);
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Only start interval if user is not verified
    if (!isVerified && auth.currentUser && !auth.currentUser.emailVerified) {
      interval = setInterval(checkVerification, 5000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [navigate, dispatch, enqueueSnackbar, isVerified]);

  // Countdown timer for resend button
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else {
      setResendDisabled(false);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleManualCheck = async () => {
    if (isVerified || !auth.currentUser) return;
    
    setIsChecking(true);
    try {
      const verified = await checkEmailVerification();
      if (verified && auth.currentUser) {
        setIsVerified(true);
        const userData = await formatUserData(auth.currentUser);
        dispatch(setUser(userData));
        dispatch(updateEmailVerification(true));
        enqueueSnackbar('Email verified successfully!', { variant: 'success' });
        
        const redirectPath = getRoleBasedRedirectPath(userData.userType);
        navigate(redirectPath);
      } else {
        enqueueSnackbar('Email not verified yet. Please check your inbox and click the verification link.', { variant: 'info' });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check verification status';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
      setResendDisabled(true);
      setCountdown(60);
      enqueueSnackbar('Verification email sent! Please check your inbox.', { variant: 'success' });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to resend verification email';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to log out';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  // If user is already verified, don't render anything
  if (!auth.currentUser || auth.currentUser.emailVerified) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Verify Your Email
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This page will automatically update when your email is verified.
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleManualCheck}
              disabled={isChecking || isVerified}
              sx={{ mr: 2 }}
            >
              {isChecking ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Check Now'
              )}
            </Button>

            <Button
              variant="outlined"
              onClick={handleResendEmail}
              disabled={resendDisabled || isVerified}
            >
              {resendDisabled 
                ? `Resend Email (${countdown}s)` 
                : 'Resend Verification Email'}
            </Button>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Haven't received the email? Check your spam folder or click the resend button above.
          </Typography>

          <Button
            variant="text"
            color="inherit"
            onClick={handleLogout}
            sx={{ mt: 2 }}
          >
            Log Out
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default VerificationPending; 