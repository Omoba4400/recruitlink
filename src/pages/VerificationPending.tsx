import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { checkEmailVerification, resendVerificationEmail, logoutUser } from '../services/auth.service';
import { updateEmailVerification } from '../store/slices/authSlice';
import { useSnackbar } from 'notistack';

const VerificationPending: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [isChecking, setIsChecking] = useState(false);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Auto-check verification status every 5 seconds
  useEffect(() => {
    const checkVerification = async () => {
      try {
        const isVerified = await checkEmailVerification();
        if (isVerified) {
          dispatch(updateEmailVerification(true));
          enqueueSnackbar('Email verified successfully!', { variant: 'success' });
          navigate('/home');
        }
      } catch (error) {
        console.error('Error checking verification status:', error);
      }
    };

    // Check immediately on mount
    checkVerification();

    // Set up interval for periodic checks
    const interval = setInterval(checkVerification, 5000);

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [navigate, dispatch, enqueueSnackbar]);

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
    setIsChecking(true);
    try {
      const isVerified = await checkEmailVerification();
      if (isVerified) {
        dispatch(updateEmailVerification(true));
        enqueueSnackbar('Email verified successfully!', { variant: 'success' });
        navigate('/home');
      } else {
        enqueueSnackbar('Email not verified yet. Please check your inbox and click the verification link.', { variant: 'info' });
      }
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to check verification status', { variant: 'error' });
    } finally {
      setIsChecking(false);
    }
  };

  const handleResendEmail = async () => {
    try {
      await resendVerificationEmail();
      setResendDisabled(true);
      setCountdown(60); // Disable resend for 60 seconds
      enqueueSnackbar('Verification email sent! Please check your inbox.', { variant: 'success' });
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to resend verification email', { variant: 'error' });
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error: any) {
      enqueueSnackbar(error.message || 'Failed to log out', { variant: 'error' });
    }
  };

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
              disabled={isChecking}
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
              disabled={resendDisabled}
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