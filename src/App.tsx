import React, { useRef, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './config/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import Messages from './pages/Messages';
import MiniChatContainer, { MiniChatContainerRef } from './components/chat/MiniChatContainer';
import Header from './components/layout/Header';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ViewProfile from './pages/ViewProfile';
import Settings from './pages/Settings';
import { User } from './types/user';
import { Box, CircularProgress, Typography } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminAuthProvider } from './contexts/AdminAuthContext';
import { SnackbarProvider } from 'notistack';
import Landing from './pages/Landing';
import VerificationPending from './pages/VerificationPending';
import PrivateRoute from './routes/PrivateRoute';
import FirebaseInit from './components/FirebaseInit';
import VerificationForm from './components/verification/VerificationForm';
import VerificationDashboard from './pages/admin/VerificationDashboard';
import AdminRoute from './components/routes/AdminRoute';
import AdminRoutes from './routes/admin.routes';
import PostView from './pages/PostView';
import { supabase } from './config/supabase';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  const chatContainerRef = useRef<MiniChatContainerRef>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const emailVerified = useSelector((state: RootState) => state.auth.emailVerified);
  const initializing = useSelector((state: RootState) => state.auth.initializing);
  const loading = useSelector((state: RootState) => state.auth.loading);

  console.log('App render - user:', user);
  console.log('App render - initializing:', initializing);
  console.log('App render - loading:', loading);

  // Update user's online status
  useEffect(() => {
    if (!user?.uid) return;

    const userStatusRef = doc(db, `users/${user.uid}/status`, 'online');
    
    const updateOnlineStatus = async (status: boolean) => {
      try {
        await setDoc(userStatusRef, {
          online: status,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch (error) {
        console.error('Error updating online status:', error);
      }
    };

    // Update when app loads
    updateOnlineStatus(true);

    // Update when user closes/leaves the page
    const onUnload = () => {
      updateOnlineStatus(false);
    };

    window.addEventListener('beforeunload', onUnload);

    return () => {
      window.removeEventListener('beforeunload', onUnload);
      updateOnlineStatus(false);
    };
  }, [user]);

  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .limit(1);
      
      if (error) {
        console.error('Supabase error:', error);
      } else {
        console.log('Supabase connection successful:', data);
      }
    } catch (err) {
      console.error('Connection test error:', err);
    }
  };

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const renderContent = () => {
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

        {/* Post routes */}
        <Route
          path="/post/:postId"
          element={
            <PrivateRoute>
              <PostView />
            </PrivateRoute>
          }
        />

        {/* Other protected routes */}
        <Route
          path="/profile/:userId"
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          }
        />
        <Route
          path="/view-profile/:userId"
          element={
            <PrivateRoute>
              <ViewProfile />
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

        {/* Messages route */}
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              {user && !emailVerified ? (
                <Navigate to="/verify-email" replace />
              ) : (
                <Messages />
              )}
            </PrivateRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <SnackbarProvider maxSnack={3}>
          <FirebaseInit />
          {renderContent()}
          {user && <MiniChatContainer ref={chatContainerRef} userId={user.uid} />}
        </SnackbarProvider>
      </AdminAuthProvider>
    </ThemeProvider>
  );
};

export default App;
