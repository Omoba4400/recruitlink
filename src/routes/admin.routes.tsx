import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import Reports from '../pages/admin/Reports';
import AdminLogin from '../pages/admin/AdminLogin';
import VerificationDashboard from '../pages/admin/VerificationDashboard';
import Users from '../pages/admin/Users';
import Messages from '../pages/admin/Messages';
import Settings from '../pages/admin/Settings';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import AdminRoute from '../components/routes/AdminRoute';
import { Box, CircularProgress } from '@mui/material';

const AdminRoutes: React.FC = () => {
  const { isAdmin, loading } = useAdminAuth();
  console.log('AdminRoutes - isAdmin:', isAdmin, 'loading:', loading);
  console.log('Current pathname:', window.location.pathname);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Admin Login Route - Always accessible */}
      <Route 
        path="login" 
        element={
          isAdmin ? <Navigate to="/admin/dashboard" replace /> : <AdminLogin />
        } 
      />
      
      {/* Protected Admin Routes */}
      <Route
        path="/*"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="verification-requests" element={<VerificationDashboard />} />
        <Route path="reports" element={<Reports />} />
        <Route path="messages" element={<Messages />} />
        <Route path="settings" element={<Settings />} />
        {/* Redirect admin root to dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        {/* Catch all for admin routes */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes; 