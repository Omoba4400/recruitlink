import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Container,
} from '@mui/material';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAdmin } = useAdminAuth();

  useEffect(() => {
    console.log('AdminLogin - Current isAdmin state:', isAdmin);
    console.log('AdminLogin - Current pathname:', location.pathname);
  }, [isAdmin, location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    console.log('Login attempt with:', { email, password });

    try {
      // Simple hardcoded check
      if (email === 'admin@athleteconnect.com' && password === 'athleteconnect') {
        console.log('Credentials matched, calling login()');
        
        // Call login and wait for it to complete
        login();
        
        // Add a small delay to ensure storage is set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if login was successful
        const isAdminSet = localStorage.getItem('isAdmin') === 'true' && 
                          sessionStorage.getItem('isAdmin') === 'true';
        
        console.log('Login state after attempt:', {
          localStorage: localStorage.getItem('isAdmin'),
          sessionStorage: sessionStorage.getItem('isAdmin'),
          contextIsAdmin: isAdmin,
          isAdminSet
        });

        if (isAdminSet) {
          console.log('Login successful, navigating to dashboard');
          navigate('/admin/dashboard', { replace: true });
        } else {
          console.error('Login failed: Storage not set properly');
          setError('Login failed. Please try again.');
        }
      } else {
        console.log('Invalid credentials');
        setError('Invalid admin credentials');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('An error occurred during login. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Admin Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <TextField
              label="Email"
              type="email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 3 }}
            >
              Login
            </Button>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminLogin; 