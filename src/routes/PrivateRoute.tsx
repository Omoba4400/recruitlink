import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Box, CircularProgress, Typography } from '@mui/material';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const initializing = useSelector((state: RootState) => state.auth.initializing);

  console.log('PrivateRoute - user:', user);
  console.log('PrivateRoute - initializing:', initializing);

  if (initializing) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography variant="body1" color="textSecondary">
          Loading...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    console.log('PrivateRoute - redirecting to login');
    return <Navigate to="/login" replace />;
  }

  console.log('PrivateRoute - rendering protected content');
  return <>{children}</>;
};

export default PrivateRoute; 