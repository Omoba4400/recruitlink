import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from '../components/admin/AdminLayout';
import Dashboard from '../pages/admin/Dashboard';
import Reports from '../pages/admin/Reports';
import AdminLogin from '../pages/admin/AdminLogin';
import { useAdminAuth } from '../contexts/AdminAuthContext';

const AdminRoutes: React.FC = () => {
  const { isAdmin } = useAdminAuth();
  console.log('AdminRoutes - isAdmin:', isAdmin);
  console.log('Current pathname:', window.location.pathname);

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
          isAdmin ? <AdminLayout /> : <Navigate to="/admin/login" replace />
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reports" element={<Reports />} />
        {/* Redirect admin root to dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} />
        {/* Catch all for admin routes */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes; 