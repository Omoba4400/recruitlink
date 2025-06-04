import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import { User } from './types/user';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { SnackbarProvider } from 'notistack';
import Home from './pages/Home';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ViewProfile from './pages/ViewProfile';
import Settings from './pages/Settings';
import VerificationPending from './pages/VerificationPending';
import PrivateRoute from './routes/PrivateRoute';
import FirebaseInit from './components/FirebaseInit';
import VerificationForm from './components/verification/VerificationForm';
import VerificationDashboard from './pages/admin/VerificationDashboard';
import AdminRoute from './components/routes/AdminRoute';
import AdminRoutes from './routes/admin.routes';

// Protected Route component
const ProtectedRoute = ({ children, requiredRole, adminRequired = false }: { 
  children: React.ReactNode, 
  requiredRole?: User['userType'],
  adminRequired?: boolean 
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) {
    return <Navigate to={adminRequired ? "/admin/login" : "/login"} replace />;
  }

  if (adminRequired && !user.isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (requiredRole && user.userType !== requiredRole) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const emailVerified = useSelector((state: RootState) => state.auth.emailVerified);
  const initializing = useSelector((state: RootState) => state.auth.initializing);
  const loading = useSelector((state: RootState) => state.auth.loading);

  console.log('App render - user:', user);
  console.log('App render - initializing:', initializing);
  console.log('App render - loading:', loading);

  const renderContent = () => {
    if (initializing || loading) {
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
            {initializing ? 'Initializing...' : 'Loading...'}
          </Typography>
        </Box>
      );
    }

    return (
      <Routes>
        {/* Public routes */}
        <Route
          path="/"
          element={
            user ? (
              emailVerified ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/verify-email" replace />
              )
            ) : (
              <Landing />
            )
          }
        />
        <Route
          path="/login"
          element={
            user ? (
              emailVerified ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/verify-email" replace />
              )
            ) : (
              <Login />
            )
          }
        />
        <Route
          path="/register"
          element={
            user ? (
              emailVerified ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/verify-email" replace />
              )
            ) : (
              <Register />
            )
          }
        />

        {/* Verification route */}
        <Route
          path="/verify-email"
          element={
            user && !emailVerified ? (
              <VerificationPending />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Protected routes */}
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              {user && !emailVerified ? (
                <Navigate to="/verify-email" replace />
              ) : (
                <Home />
              )}
            </ProtectedRoute>
          }
        />

        {/* Other protected routes */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:id"
          element={
            <ProtectedRoute>
              {user && !emailVerified ? (
                <Navigate to="/verify-email" replace />
              ) : (
                <ViewProfile />
              )}
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route path="/admin/*" element={<AdminRoutes />} />

        {/* Add these new routes */}
        <Route 
          path="/verify" 
          element={
            <PrivateRoute>
              <VerificationForm />
            </PrivateRoute>
          } 
        />
        
        <Route 
          path="/admin/verifications" 
          element={
            <AdminRoute>
              <VerificationDashboard />
            </AdminRoute>
          } 
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <SnackbarProvider maxSnack={3}>
      <ThemeProvider>
        <AdminAuthProvider>
          <FirebaseInit />
          {renderContent()}
        </AdminAuthProvider>
      </ThemeProvider>
    </SnackbarProvider>
  );
};

export default App;
