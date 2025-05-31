import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminAuthContextType {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status on mount and when storage changes
  useEffect(() => {
    const checkAdminStatus = () => {
      const adminSession = localStorage.getItem('isAdmin') === 'true' && 
                          sessionStorage.getItem('isAdmin') === 'true';
      console.log('AdminAuthProvider - Checking admin status:', {
        localStorage: localStorage.getItem('isAdmin'),
        sessionStorage: sessionStorage.getItem('isAdmin'),
        adminSession
      });
      setIsAdmin(adminSession);
    };

    // Check initial status
    checkAdminStatus();

    // Listen for storage changes
    const handleStorageChange = () => {
      checkAdminStatus();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const login = () => {
    console.log('AdminAuthProvider - Setting admin status to true');
    localStorage.setItem('isAdmin', 'true');
    sessionStorage.setItem('isAdmin', 'true');
    setIsAdmin(true);
  };

  const logout = () => {
    console.log('AdminAuthProvider - Setting admin status to false');
    localStorage.removeItem('isAdmin');
    sessionStorage.removeItem('isAdmin');
    setIsAdmin(false);
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}; 