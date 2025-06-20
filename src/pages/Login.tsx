import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Box,
  Alert,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { loginUser, resendVerificationEmail, sendPasswordResetEmail } from '../services/auth.service';
import { setUser, setError as setAuthError } from '../store/slices/authSlice';
import { useSnackbar } from 'notistack';
import { User } from '../types/user';

const formatUserData = (firebaseUser: any): User => {
  const timestamp = new Date().toISOString();
  const userData: User = {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    userType: 'athlete',
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLogin: timestamp,
    bio: '',
    location: '',
    verified: false,
    blocked: false,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber || '',
    phoneVerified: false,
    isAdmin: false,
    verificationStatus: 'none',
    verificationStep: 'email',
    privacySettings: {
      profileVisibility: 'public',
      allowMessagesFrom: 'everyone',
      showEmail: true,
      showLocation: true,
      showAcademicInfo: true,
      showAthleteStats: true
    },
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: ''
    },
    followers: [],
    following: [],
    connections: [],
    blockedUsers: [],
    messageThreads: []
  };
  return userData;
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!email || !password) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const user = await loginUser(email, password);
      
      if (user) {
        dispatch(setUser(formatUserData(user)));
        if (!user.emailVerified) {
          setNeedsVerification(true);
        } else {
          navigate('/home');
        }
      } else {
        throw new Error('Login failed: No user data received');
      }
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during login';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setError('Verification email has been resent. Please check your inbox.');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email';
      setError(errorMessage);
    }
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      enqueueSnackbar('Please enter your email address', { variant: 'error' });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(resetEmail)) {
      enqueueSnackbar('Please enter a valid email address', { variant: 'error' });
      return;
    }

    setResetLoading(true);
    try {
      await sendPasswordResetEmail(resetEmail);
      setResetEmailSent(true);
      enqueueSnackbar('Password reset email sent successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar(error instanceof Error ? error.message : 'Failed to send reset email', { variant: 'error' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setResetEmail('');
    setResetEmailSent(false);
  };

  if (needsVerification) {
    return (
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
            <Alert severity="warning" sx={{ mb: 3 }}>
              Please verify your email address to continue.
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              A verification link has been sent to your email address. Please check your email and click the verification link.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={handleResendVerification}
              fullWidth
              sx={{ mb: 2 }}
            >
              Resend Verification Email
            </Button>
            <Button
              variant="outlined"
              onClick={() => setNeedsVerification(false)}
              fullWidth
            >
              Back to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <IconButton
          component={RouterLink}
          to="/"
          sx={{
            position: 'absolute',
            top: -40,
            left: 0,
          }}
        >
          <HomeIcon />
        </IconButton>

        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Sign In
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {needsVerification && (
            <Alert severity="warning" sx={{ width: '100%', mb: 2 }}>
              Please verify your email address. 
              <Button
                size="small"
                onClick={async () => {
                  try {
                    await resendVerificationEmail();
                    enqueueSnackbar('Verification email sent!', { variant: 'success' });
                  } catch (err) {
                    enqueueSnackbar('Failed to send verification email', { variant: 'error' });
                  }
                }}
              >
                Resend verification email
              </Button>
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!error && error.toLowerCase().includes('email')}
              sx={{ mb: 2 }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!error && error.toLowerCase().includes('password')}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                  Signing in...
                </Box>
              ) : (
                'Sign In'
              )}
            </Button>
            <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setForgotPasswordOpen(true)}
              >
                Forgot password?
              </Link>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Forgot Password Dialog */}
      <Dialog 
        open={forgotPasswordOpen} 
        onClose={handleCloseForgotPassword}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {resetEmailSent ? 'Check Your Email' : 'Reset Password'}
        </DialogTitle>
        <DialogContent>
          {resetEmailSent ? (
            <Typography>
              We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password.
            </Typography>
          ) : (
            <TextField
              autoFocus
              margin="dense"
              id="resetEmail"
              label="Email Address"
              type="email"
              fullWidth
              variant="outlined"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={resetLoading}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseForgotPassword}>
            {resetEmailSent ? 'Close' : 'Cancel'}
          </Button>
          {!resetEmailSent && (
            <Button 
              onClick={handleForgotPassword} 
              variant="contained"
              disabled={resetLoading}
            >
              {resetLoading ? <CircularProgress size={24} /> : 'Send Reset Link'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Login; 