import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from './store';
import { User } from './types/user';
import { auth, db } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  setUser,
  clearUser,
  updateEmailVerification,
  setInitializing
} from './store/slices/authSlice';
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
import { Box, CircularProgress, Typography } from '@mui/material';
import PrivateRoute from './routes/PrivateRoute';

// Admin Pages
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
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const emailVerified = useSelector((state: RootState) => state.auth.emailVerified);
  const initializing = useSelector((state: RootState) => state.auth.initializing);

  console.log('App render - user:', user);
  console.log('App render - initializing:', initializing);

  useEffect(() => {
    console.log('Setting up auth state observer');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        dispatch(setInitializing(true));
        
        if (firebaseUser) {
          console.log('Firebase user authenticated:', firebaseUser.uid);
          
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const firestoreData = userDoc.data() as User;
            console.log('Firestore user data:', firestoreData);
            
            const userData: User = {
              ...firestoreData,
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firestoreData.displayName,
              photoURL: firebaseUser.photoURL,
              emailVerified: firebaseUser.emailVerified,
              lastLogin: new Date().toISOString(),
            };

            console.log('Dispatching user data to Redux:', userData);
            dispatch(setUser(userData));
            dispatch(updateEmailVerification(firebaseUser.emailVerified));

            // Redirect admin users to admin dashboard
            if (userData.isAdmin && window.location.pathname === '/home') {
              window.location.href = '/admin/dashboard';
            }
          } else {
            console.log('No Firestore document found, creating basic user');
            const basicUserData: User = {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL,
              userType: 'athlete',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              bio: '',
              location: '',
              isVerified: false,
              emailVerified: firebaseUser.emailVerified,
              isAdmin: false,
              socialLinks: {
                instagram: '',
                twitter: '',
                linkedin: '',
                youtube: '',
              },
              followers: [],
              following: [],
              connections: []
            };

            console.log('Dispatching basic user data to Redux:', basicUserData);
            dispatch(setUser(basicUserData));
            dispatch(updateEmailVerification(firebaseUser.emailVerified));

            // Redirect to profile completion if needed
            if (window.location.pathname === '/home') {
              window.location.href = '/profile';
            }
          }
        } else {
          console.log('No Firebase user - clearing Redux store');
          dispatch(clearUser());
        }
      } catch (error) {
        console.error('Error in auth state observer:', error);
        dispatch(clearUser());
      } finally {
        console.log('Auth initialization complete');
        dispatch(setInitializing(false));
      }
    });

    return () => {
      console.log('Cleaning up auth state observer');
      unsubscribe();
    };
  }, [dispatch]);

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
          Initializing...
        </Typography>
      </Box>
    );
  }

  return (
    <SnackbarProvider maxSnack={3}>
      <ThemeProvider>
        <AdminAuthProvider>
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

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </ThemeProvider>
    </SnackbarProvider>
  );
};

export default App;
