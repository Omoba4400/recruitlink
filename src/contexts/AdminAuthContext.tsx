import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface AdminAuthContextType {
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, authLoading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AdminAuthProvider - Auth state changed:', { 
      user: user?.uid, 
      authLoading, 
      isAdmin 
    });

    const checkAdminStatus = async () => {
      try {
        if (!user) {
          console.log('No user found, setting isAdmin to false');
          setIsAdmin(false);
          setLoading(false);
          return;
        }

        console.log('Checking admin status for user:', user.uid);

        // Check if user has admin role in Firestore
        const adminDoc = await getDocs(query(
          collection(db, 'users'),
          where('uid', '==', user.uid),
          where('isAdmin', '==', true)
        ));

        const hasAdminRole = !adminDoc.empty;
        console.log('Admin check result:', { 
          hasAdminRole, 
          documentsFound: adminDoc.size 
        });

        setIsAdmin(hasAdminRole);

        // Update storage to match Firestore state
        if (hasAdminRole) {
          localStorage.setItem('adminSession', 'true');
          sessionStorage.setItem('adminSession', 'true');
        } else {
          localStorage.removeItem('adminSession');
          sessionStorage.removeItem('adminSession');
        }
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  const login = async () => {
    if (!user) {
      console.log('Login attempted without user');
      return;
    }
    
    try {
      console.log('Attempting admin login for user:', user.uid);
      const adminDoc = await getDocs(query(
        collection(db, 'users'),
        where('uid', '==', user.uid),
        where('isAdmin', '==', true)
      ));

      if (adminDoc.empty) {
        console.log('Admin login failed: User is not an admin');
        throw new Error('User is not an admin');
      }

      console.log('Admin login successful');
      localStorage.setItem('adminSession', 'true');
      sessionStorage.setItem('adminSession', 'true');
      setIsAdmin(true);
    } catch (error) {
      console.error('Error during admin login:', error);
      throw error;
    }
  };

  const logout = () => {
    console.log('Admin logout called');
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('adminSession');
    setIsAdmin(false);
    auth.signOut();
  };

  return (
    <AdminAuthContext.Provider value={{ isAdmin, login, logout, loading: authLoading || loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}; 