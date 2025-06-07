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
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { loginUser, resendVerificationEmail } from '../services/auth.service';
import { setUser, setError as setAuthError } from '../store/slices/authSlice';
import { useSnackbar } from 'notistack';
import { User } from '../types/user';

const formatUserData = (firebaseUser: any): User => {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    userType: 'athlete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: '',
    location: '',
    verified: false,
    blocked: false,
    emailVerified: firebaseUser.emailVerified,
    isAdmin: false,
    verificationStatus: 'none',
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
    connections: []
  };
};

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
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
    } catch (err) {
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
          onClick={() => navigate('/')}
          sx={{
            position: 'absolute',
            top: -40,
            left: 0,
            color: 'primary.main',
          }}
        >
          <HomeIcon />
        </IconButton>

        <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
          <Typography component="h1" variant="h5" align="center" sx={{ mb: 3 }}>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
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
              error={!!error && error.includes('email')}
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
              error={!!error && error.includes('password')}
              sx={{ mb: 3 }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 