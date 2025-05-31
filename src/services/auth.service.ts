import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  AuthError,
  AuthErrorCodes,
  sendEmailVerification,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
  deleteUser,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { ref, deleteObject, listAll } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { User } from '../types/user';

const handleAuthError = (error: AuthError): never => {
  let message = 'An error occurred during authentication.';
  
  switch (error.code) {
    case 'auth/email-already-in-use':
      message = 'This email is already registered. Please sign in instead.';
      break;
    case 'auth/invalid-email':
      message = 'Please enter a valid email address.';
      break;
    case 'auth/weak-password':
      message = 'Password must be at least 6 characters long.';
      break;
    case 'auth/user-not-found':
      message = 'Account not found. Please sign up first.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please try again.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed attempts. Please try again later.';
      break;
    case 'auth/network-request-failed':
      message = 'Network error. Please check your internet connection.';
      break;
    case 'auth/requires-recent-login':
      message = 'Please sign out and sign in again before deleting your account.';
      break;
    case 'auth/invalid-credential':
      message = 'Invalid login credentials. Please check your email and password.';
      break;
    case 'auth/operation-not-allowed':
      message = 'This login method is not enabled. Please try another method.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'Login popup was closed. Please try again.';
      break;
    default:
      // Don't expose internal error details to users
      console.error('Auth error:', error);
      message = 'An error occurred. Please try again.';
  }

  throw new Error(message);
};

const validateRegistrationData = (email: string, password: string, displayName: string) => {
  if (!email || !password || !displayName) {
    throw new Error('Email, password, and display name are required.');
  }
  
  if (email === 'admin@athleteconnect.com') {
    throw new Error('This email address is not allowed for registration.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Please enter a valid email address.');
  }
};

const createUserDocument = async (
  firebaseUser: FirebaseUser,
  displayName: string,
  userType: User['userType']
): Promise<User> => {
  const userData: User = {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || displayName,
    userType,
    photoURL: firebaseUser.photoURL,
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

  await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  return userData;
};

const formatUserData = (userCredential: UserCredential, userType?: string): User => {
  const { user: firebaseUser } = userCredential;
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
    userType: (userType as User['userType']) || 'athlete',
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
    connections: [],
  };
};

export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  userType: User['userType']
): Promise<{ user: User; emailVerified: boolean }> => {
  try {
    validateRegistrationData(email, password, displayName);
    
    console.log('Starting registration with:', { email, displayName, userType });
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const { user } = userCredential;

      console.log('User created successfully:', user.uid);

      await updateProfile(user, { displayName });
      console.log('Profile updated with displayName');

      // Send email verification
      await sendEmailVerification(user);
      console.log('Verification email sent');

      const userData = await createUserDocument(user, displayName, userType);
      console.log('User data saved to Firestore');
      
      return {
        user: userData,
        emailVerified: user.emailVerified
      };
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Registration error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    
    if (error instanceof Error && 'code' in error) {
      handleAuthError(error as AuthError);
    }
    throw error;
  }
};

export const checkEmailVerification = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  // Reload the user to get the latest emailVerified status
  await reload(user);
  return user.emailVerified;
};

export const loginUser = async (
  email: string, 
  password: string, 
  isAdminLogin: boolean = false
): Promise<{ user: User; emailVerified: boolean }> => {
  try {
    if (!email || !password) {
      throw new Error('Please enter your email and password.');
    }

    console.log('Login attempt:', { email, isAdminLogin });

    // Hardcoded admin credentials check
    if (isAdminLogin) {
      if (email === 'admin@athleteconnect.com' && password === 'athleteconnect') {
        console.log('Valid admin credentials provided');
        
        const adminData: User = {
          uid: 'admin',
          id: 'admin',
          email: 'admin@athleteconnect.com',
          displayName: 'Admin',
          userType: 'company',
          photoURL: null,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          bio: 'System Administrator',
          location: '',
          isVerified: true,
          emailVerified: true,
          isAdmin: true,
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

        return { user: adminData, emailVerified: true };
      } else {
        throw new Error('Invalid admin credentials');
      }
    }

    // Regular user login
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const { user: firebaseUser } = userCredential;
      
      // Try to get the user document
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      let userData: User;

      if (!userDoc.exists()) {
        console.log('Creating missing user document in Firestore');
        // Create user document if it doesn't exist
        userData = {
          uid: firebaseUser.uid,
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || email.split('@')[0],
          userType: 'athlete', // Default to athlete
          photoURL: firebaseUser.photoURL,
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

        // Save the new user document
        await setDoc(doc(db, 'users', firebaseUser.uid), userData);
      } else {
        userData = userDoc.data() as User;
        
        // Update lastLogin
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          lastLogin: new Date().toISOString(),
          emailVerified: firebaseUser.emailVerified
        });
      }

      if (isAdminLogin && !userData.isAdmin) {
        throw new Error('This account does not have admin privileges');
      }

      return {
        user: userData,
        emailVerified: firebaseUser.emailVerified
      };
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        throw new Error('Account not found. Please sign up first.');
      }
      if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Login error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    
    if (error instanceof Error && 'code' in error) {
      handleAuthError(error as AuthError);
    }
    throw error;
  }
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  
  try {
    await sendEmailVerification(user);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};

export const sendPasswordReset = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to log out. Please try again.');
  }
};

export const reauthenticateUser = async (email: string, password: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error) {
    console.error('Error re-authenticating:', error);
    throw error;
  }
};

export const deleteUserAccount = async (email: string, password: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please sign in to delete your account.');
    }

    try {
      // First, try to re-authenticate the user
      await reauthenticateUser(email, password);

      // Delete Firestore data first
      await deleteDoc(doc(db, 'users', user.uid));
      console.log('Firestore user data deleted');

      // Then delete the auth account
      await user.delete();
      console.log('Auth account deleted');
    } catch (error: any) {
      if (error.code === 'auth/requires-recent-login') {
        throw new Error('Please sign out and sign in again before deleting your account.');
      }
      if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Error deleting account:', error);
    if (error instanceof Error && 'code' in error) {
      handleAuthError(error as AuthError);
    }
    throw error;
  }
}; 