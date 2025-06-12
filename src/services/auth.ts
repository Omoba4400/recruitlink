import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  UserCredential,
} from 'firebase/auth';
import { User } from '../types/user';

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
    blocked: false,
    isAdmin: false,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber || '',
    phoneVerified: false,
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: '',
      youtube: '',
    },
    followers: [],
    following: [],
    connections: [],
    verificationStatus: 'none',
    privacySettings: {
      profileVisibility: 'public',
      allowMessagesFrom: 'everyone',
      showEmail: true,
      showLocation: true,
      showAcademicInfo: true,
      showAthleteStats: true
    }
  };
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return formatUserData(userCredential);
  } catch (error) {
    throw error;
  }
};

export const registerUser = async (
  email: string,
  password: string,
  userType: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return formatUserData(userCredential, userType);
  } catch (error) {
    throw error;
  }
}; 