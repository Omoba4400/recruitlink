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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  IconButton,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';
import { registerUser } from '../services/auth.service';
import { setUser, setError } from '../store/slices/authSlice';
import { User } from '../types';
import { useSnackbar } from 'notistack';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  userType: User['userType'];
}

const Register: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    userType: 'athlete',
  });
  const [loading, setLoading] = useState(false);
  const [error, setLocalError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { enqueueSnackbar } = useSnackbar();

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<User['userType']>) => {
    setFormData((prev) => ({
      ...prev,
      userType: e.target.value as User['userType'],
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setLocalError(null);

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate required fields
      if (!formData.email || !formData.password || !formData.displayName) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Validate password length
      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      const result = await registerUser(
        formData.email,
        formData.password,
        formData.displayName,
        formData.userType
      );

      dispatch(setUser(result.user));
      enqueueSnackbar('Registration successful! Please verify your email.', { variant: 'success' });
      setVerificationSent(true);
      navigate('/verify-email');
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setLocalError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
      dispatch(setError(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const inputProps = {
    sx: {
      mb: { xs: 3, sm: 2 },
      '& .MuiInputBase-root': {
        height: { xs: '56px', sm: '48px' }
      },
      '& .MuiInputLabel-root': {
        fontSize: { xs: '1rem', sm: '0.875rem' }
      },
      '& .MuiInputBase-input': {
        fontSize: { xs: '1.1rem', sm: '1rem' }
      }
    }
  };

  if (verificationSent) {
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
            <Alert severity="success" sx={{ mb: 3 }}>
              A verification link has been sent to your email address.
            </Alert>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Please check your email and click the verification link to complete your registration.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/login')}
              fullWidth
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      </Container>
    );
  }

  return (
    <Container 
      component="main" 
      maxWidth="xs"
      sx={{
        px: { xs: 2, sm: 0 }
      }}
    >
      <Box
        sx={{
          marginTop: { xs: 4, sm: 8 },
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
            top: { xs: -20, sm: -40 },
            left: { xs: 16, sm: 0 },
            color: 'primary.main',
            padding: { xs: '12px', sm: '8px' },
            '& svg': {
              fontSize: { xs: '2rem', sm: '1.5rem' }
            }
          }}
        >
          <HomeIcon />
        </IconButton>

        <Paper
          elevation={3}
          sx={{
            p: { xs: 3, sm: 4 },
            width: '100%',
            borderRadius: { xs: 2, sm: 1 }
          }}
        >
          <Typography 
            component="h1" 
            variant="h5" 
            align="center"
            sx={{ 
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '1.25rem' }
            }}
          >
            Create Account
          </Typography>
          {error && (
            <Alert 
              severity="error" 
              sx={{ 
                width: '100%', 
                mb: 3,
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleTextChange}
              error={!!error && error.includes('email')}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              id="displayName"
              label="Full Name"
              name="displayName"
              autoComplete="name"
              value={formData.displayName}
              onChange={handleTextChange}
              error={!!error && error.includes('name')}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleTextChange}
              error={!!error && error.includes('password')}
              {...inputProps}
            />
            <TextField
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleTextChange}
              error={!!error && error.includes('password')}
              {...inputProps}
            />
            <FormControl 
              fullWidth 
              required
              sx={{ mb: { xs: 3, sm: 2 } }}
            >
              <InputLabel id="userType-label">I am a</InputLabel>
              <Select
                labelId="userType-label"
                id="userType"
                name="userType"
                value={formData.userType}
                label="I am a"
                onChange={handleSelectChange}
              >
                <MenuItem value="athlete">Athlete</MenuItem>
                <MenuItem value="coach">Coach</MenuItem>
                <MenuItem value="team">Team</MenuItem>
                <MenuItem value="company">Company</MenuItem>
              </Select>
            </FormControl>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                height: { xs: '48px', sm: '42px' },
                fontSize: { xs: '1.1rem', sm: '1rem' }
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link 
                component={RouterLink} 
                to="/login"
                variant="body2"
                sx={{ fontSize: { xs: '1rem', sm: '0.875rem' } }}
              >
                Already have an account? Sign in
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register; 