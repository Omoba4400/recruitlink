import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UserType } from '../types/user';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserType;
  adminRequired?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  adminRequired = false,
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const emailVerified = user?.emailVerified ?? false;

  if (!user) {
    return <Navigate to={adminRequired ? "/admin/login" : "/login"} replace />;
  }

  if (!emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (adminRequired && !user.isAdmin) {
    return <Navigate to="/home" replace />;
  }

  if (requiredRole && user.userType !== requiredRole) {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute; 