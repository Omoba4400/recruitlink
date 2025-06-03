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
import { User, UserType } from '../types/user';

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
  const timestamp = new Date().toISOString();
  
  const baseUserData: User = {
    uid: firebaseUser.uid,
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || displayName,
    userType,
    photoURL: firebaseUser.photoURL || '',
    createdAt: timestamp,
    updatedAt: timestamp,
    lastLogin: timestamp,
    bio: '',
    location: '',
    verified: false,
    emailVerified: firebaseUser.emailVerified,
    isAdmin: false,
    verificationStatus: 'none',
    privacySettings: {
      profileVisibility: 'public',
      allowMessagesFrom: 'everyone',
      showEmail: true,
      showLocation: true,
      showAcademicInfo: true,
      showAthleteStats: true
    },
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

  let typeSpecificData = {};

  if (userType === 'athlete') {
    typeSpecificData = {
      athleteInfo: {
        sports: [{
          sport: '',
          position: '',
          level: '',
          experience: 0,
          specialties: [],
          achievements: []
        }],
        academicInfo: {
          currentSchool: '',
          graduationYear: ''
        },
        verificationStatus: 'pending' as const,
        media: [],
        memberships: [],
        interests: [],
        activities: [],
        awards: [],
        achievements: [],
        eligibility: {
          isEligible: true
        },
        recruitingStatus: 'open' as const
      }
    };
  } else if (userType === 'coach') {
    typeSpecificData = {
      coachInfo: {
        specialization: [],
        experience: '',
        certifications: [],
        canMessageAthletes: false,
        verificationStatus: 'pending' as const
      }
    };
  } else if (userType === 'team') {
    typeSpecificData = {
      teamInfo: {
        teamName: '',
        sport: '',
        canMessageAthletes: false,
        achievements: [],
        roster: [],
        openPositions: []
      }
    };
  } else if (userType === 'sponsor') {
    typeSpecificData = {
      sponsorInfo: {
        companyName: '',
        industry: '',
        canMessageAthletes: false,
        sponsorshipTypes: [],
        activeOpportunities: []
      }
    };
  } else if (userType === 'media') {
    typeSpecificData = {
      mediaInfo: {
        organization: '',
        canMessageAthletes: false,
        coverageAreas: [],
        mediaType: []
      }
    };
  }

  const userData = {
    ...baseUserData,
    ...typeSpecificData
  } as User;

  // Create the user document in Firestore
  await setDoc(doc(db, 'users', firebaseUser.uid), userData);
  return userData;
};

const formatUserData = (userCredential: UserCredential, userType?: string): User => {
  const { user: firebaseUser } = userCredential;
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    userType: (userType as User['userType']) || 'athlete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: '',
    location: '',
    verified: false,
    emailVerified: firebaseUser.emailVerified,
    isAdmin: false,
    verificationStatus: 'none',
    privacySettings: {
      profileVisibility: 'public',
      allowMessagesFrom: 'everyone',
      showEmail: true,
      showLocation: true,
      showAcademicInfo: true,
      showAthleteStats: true
    },
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

interface AuthResponse {
  user: FirebaseUser;
  userType: UserType;
}

export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  userType: UserType
): Promise<{ user: FirebaseUser; userData: User; userType: UserType }> => {
  try {
    validateRegistrationData(email, password, displayName);
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Update the user's display name in Firebase Auth
    await updateProfile(user, { displayName });

    // Create the user document in Firestore with all necessary fields
    const timestamp = new Date().toISOString();
    const userData: User = {
      id: user.uid,
      uid: user.uid,
      email: user.email || '',
      displayName: displayName,
      userType,
      photoURL: user.photoURL || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      lastLogin: timestamp,
      bio: '',
      location: '',
      verified: false,
      emailVerified: user.emailVerified,
      isAdmin: false,
      verificationStatus: 'none',
      privacySettings: {
        profileVisibility: 'public',
        allowMessagesFrom: 'everyone',
        showEmail: true,
        showLocation: true,
        showAcademicInfo: true,
        showAthleteStats: true
      },
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

    // Create the user document in Firestore
    await setDoc(doc(db, 'users', user.uid), userData);

    // Send email verification
    await sendEmailVerification(user);

    return { user, userData, userType };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message);
  }
};

export const checkEmailVerification = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  // Reload the user to get the latest emailVerified status
  await reload(user);
  
  if (user.emailVerified) {
    // Update the user document in Firestore with emailVerified status
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      emailVerified: true,
      updatedAt: new Date().toISOString()
    });
  }
  
  return user.emailVerified;
};

export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.message);
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

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
    throw new Error(error.message);
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

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message);
  }
}; 