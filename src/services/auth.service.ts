import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  AuthError,
  AuthErrorCodes,
  sendEmailVerification,
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
  deleteUser,
  reload,
  EmailAuthProvider,
  reauthenticateWithCredential,
  PhoneAuthProvider,
  linkWithPhoneNumber,
  updatePhoneNumber,
  PhoneAuthCredential
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
  getDocs,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserType, UserProfile, VerificationStep } from '../types/user';
import { supabase } from '../config/supabase';

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
      message = 'No account found with this email. Please check your email or create a new account.';
      break;
    case 'auth/wrong-password':
      message = 'Incorrect password. Please check your password and try again.';
      break;
    case 'auth/invalid-credential':
      message = 'The email or password you entered is incorrect. Please try again.';
      break;
    case 'auth/too-many-requests':
      message = 'Too many failed login attempts. Please wait a few minutes before trying again.';
      break;
    case 'auth/network-request-failed':
      message = 'Unable to connect. Please check your internet connection and try again.';
      break;
    case 'auth/requires-recent-login':
      message = 'For security reasons, please sign out and sign in again to continue.';
      break;
    case 'auth/operation-not-allowed':
      message = 'This login method is currently not available. Please try another way to sign in.';
      break;
    case 'auth/popup-closed-by-user':
      message = 'The sign-in window was closed. Please try signing in again.';
      break;
    default:
      // Don't expose internal error details to users
      console.error('Auth error:', error);
      message = 'Something went wrong. Please try again later.';
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
    blocked: false,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber || '',
    phoneVerified: false,
    isAdmin: false,
    verificationStatus: 'none',
    verificationStep: 'email',
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
  } else if (userType === 'college') {
    typeSpecificData = {
      collegeInfo: {
        name: '',
        location: '',
        division: '',
        conference: '',
        sports: [],
        teams: []
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
        companyName: '',
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
    verificationStep: 'email',
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
      blocked: false,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber || '',
      phoneVerified: false,
      isAdmin: false,
      verificationStatus: 'none',
      verificationStep: 'email',
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

    // Update verification step to ensure user starts at email verification
    await updateDoc(doc(db, 'users', user.uid), {
      verificationStep: 'email'
    });

    return { user, userData, userType };
  } catch (error: any) {
    console.error('Registration error:', error);
    // Preserve the Firebase error code and message
    if (error.code) {
      throw error;
    }
    throw new Error(error.message);
  }
};

export const checkEmailVerification = async (): Promise<boolean> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in');
  }

  try {
    // Reload the user to get the latest emailVerified status
    await reload(user);
    
    if (user.emailVerified) {
      // Get current user data from Firestore
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      // Only update if not already verified in Firestore
      if (!userData?.emailVerified) {
        // Update the user document in Firestore with emailVerified status
        await updateDoc(userRef, {
          emailVerified: true,
          verificationStep: 'phone',
          updatedAt: new Date().toISOString()
        });
      }
    }
    
    return user.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    return handleAuthError(error);
  }
};

export const resendVerificationEmail = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('No user is currently signed in.');
  }
  
  try {
    // Check if email is already verified
    await reload(user);
    if (user.emailVerified) {
      return { verified: true };
    }

    // Get the last email sent timestamp from localStorage
    const lastEmailSent = localStorage.getItem('lastVerificationEmailSent');
    const cooldownPeriod = 60 * 1000; // 60 seconds cooldown

    if (lastEmailSent) {
      const timeSinceLastEmail = Date.now() - parseInt(lastEmailSent);
      if (timeSinceLastEmail < cooldownPeriod) {
        const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastEmail) / 1000);
        throw new Error(`Please wait ${remainingTime} seconds before requesting another verification email.`);
      }
    }

    // Send the verification email
    await sendEmailVerification(user);
    
    // Store the timestamp
    localStorage.setItem('lastVerificationEmailSent', Date.now().toString());
    
    return { sent: true };
  } catch (error) {
    console.error('Error sending verification email:', error);
    if (error instanceof Error && error.toString().includes('auth/too-many-requests')) {
      throw new Error('Too many verification email requests. Please wait a few minutes before trying again.');
    }
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Error sending password reset email:', error);
    
    // Handle specific Firebase auth errors
    switch (error.code) {
      case 'auth/invalid-email':
        throw new Error('Invalid email address');
      case 'auth/user-not-found':
        throw new Error('No account found with this email address');
      case 'auth/too-many-requests':
        throw new Error('Too many attempts. Please try again later');
      default:
        throw new Error('Failed to send password reset email. Please try again');
    }
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

    // Make sure the email matches the current user's email
    if (email !== user.email) {
      throw new Error('The provided email does not match your account email');
    }

    const credential = EmailAuthProvider.credential(email, password);
    await reauthenticateWithCredential(user, credential);
  } catch (error: any) {
    console.error('Error re-authenticating:', error);
    if (error.code === 'auth/wrong-password') {
      throw new Error('Incorrect password. Please try again.');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid credentials. Please check your password and try again.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many attempts. Please try again later.');
    } else if (error.code === 'auth/user-mismatch') {
      throw new Error('The provided email does not match your account.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('No account found with this email address.');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('For security reasons, please sign out and sign in again before deleting your account.');
    }
    // If it's our custom error from the email check above, pass it through
    if (error.message && !error.code) {
      throw error;
    }
    // For any other errors
    throw new Error('Failed to verify your identity. Please try again.');
  }
};

export const deleteUserAccount = async (email: string, password: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // First, reauthenticate the user
    await reauthenticateUser(email, password);

    try {
      // Delete Firestore document first
      const userRef = doc(db, 'users', user.uid);
      await deleteDoc(userRef);
      console.log('Firestore document deleted');

      // Then delete the auth account
      await deleteUser(user);
      console.log('Auth account deleted');
    } catch (error) {
      console.error('Error during deletion process:', error);
      // If Firestore deletion fails but we can still delete the auth account
      if (error instanceof Error && error.toString().includes('permission')) {
        await deleteUser(user);
        console.log('Auth account deleted (after Firestore error)');
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('Error deleting account:', error);
    throw new Error('Failed to delete account. Please try again.');
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message);
  }
};

export const updateUserPhoneNumber = async (phoneNumber: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Update phone number in Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      phoneNumber,
      phoneVerified: false,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating phone number:', error);
    throw error;
  }
};

export const verifyPhoneNumber = async (credential: PhoneAuthCredential): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('No user is currently signed in');
    }

    // Link the phone credential with the user
    await updatePhoneNumber(user, credential);

    // Update phone verification status in Firestore
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      phoneVerified: true,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error verifying phone number:', error);
    throw error;
  }
};

export const createUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const timestamp = new Date().toISOString();
    
    // Create a base profile with required fields
    const baseProfile = {
      uid,
      email: data.email || '',
      displayName: data.displayName || '',
      photoURL: data.photoURL || '',  // Set empty string as default
      userType: data.userType || 'athlete',
      createdAt: timestamp,
      updatedAt: timestamp,
      verified: false,
      verificationStatus: 'none',
      verificationStep: 'email',
      bio: '',
      location: '',
      socialLinks: {
        instagram: '',
        twitter: '',
        linkedin: '',
        youtube: ''
      },
      followers: [],
      following: [],
      connections: [],
      privacySettings: {
        profileVisibility: 'public',
        allowMessagesFrom: 'everyone',
        showEmail: true,
        showLocation: true,
        showAcademicInfo: true,
        showAthleteStats: true
      }
    };

    // Add type-specific info if present
    const userProfile = {
      ...baseProfile,
      ...(data.athleteInfo && { athleteInfo: data.athleteInfo }),
      ...(data.coachInfo && { coachInfo: data.coachInfo }),
      ...(data.collegeInfo && { collegeInfo: data.collegeInfo }),
      ...(data.sponsorInfo && { sponsorInfo: data.sponsorInfo }),
      ...(data.mediaInfo && { mediaInfo: data.mediaInfo })
    };

    await setDoc(userRef, userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const handleUserTypeChange = (userType: UserType) => {
  if (userType === 'athlete') {
    return {
      athleteInfo: {
        sports: [],
        academicInfo: {
          currentSchool: '',
          graduationYear: ''
        },
        verificationStatus: 'pending',
        media: [],
        memberships: [],
        interests: [],
        activities: [],
        awards: [],
        achievements: [],
        eligibility: {
          isEligible: true
        },
        recruitingStatus: 'open'
      }
    };
  } else if (userType === 'coach') {
    return {
      coachInfo: {
        specialization: [],
        experience: '',
        certifications: [],
        canMessageAthletes: false,
        verificationStatus: 'pending'
      }
    };
  } else if (userType === 'college') {
    return {
      collegeInfo: {
        name: '',
        location: '',
        division: '',
        conference: '',
        sports: [],
        teams: []
      }
    };
  } else if (userType === 'sponsor') {
    return {
      sponsorInfo: {
        companyName: '',
        industry: '',
        canMessageAthletes: false,
        sponsorshipTypes: [],
        activeOpportunities: []
      }
    };
  } else if (userType === 'media') {
    return {
      mediaInfo: {
        companyName: '',
        coverageAreas: [],
        mediaType: []
      }
    };
  } else {
    return {};
  }
};

export const updateUserVerificationStep = async (
  userId: string,
  step: VerificationStep
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      verificationStep: step,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating verification step:', error);
    throw new Error('Failed to update verification step');
  }
}; 