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
  arrayRemove
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User, UserType } from '../types/user';
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
    blocked: false,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber || '',
    phoneVerified: false,
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

const formatUserData = (firebaseUser: any): User => {
  return {
    id: firebaseUser.uid,
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || undefined,
    userType: 'athlete',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
    bio: '',
    location: '',
    verified: false,
    blocked: false,
    emailVerified: firebaseUser.emailVerified,
    phoneNumber: firebaseUser.phoneNumber || '',
    phoneVerified: false,
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
      youtube: ''
    },
    followers: [],
    following: [],
    connections: []
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

    // First, re-authenticate the user
    try {
      await reauthenticateUser(email, password);
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        throw new Error('Incorrect password. Please try again.');
      }
      throw error;
    }

    // Get user data before deletion
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.warn('User document not found in Firestore');
    }

    // Delete user's data in this order:
    
    // 1. Delete verification requests and their associated Cloudinary documents
    const verificationQuery = query(
      collection(db, 'verifications'),
      where('userId', '==', user.uid)
    );
    const verificationDocs = await getDocs(verificationQuery);
    for (const doc of verificationDocs.docs) {
      const verificationData = doc.data();
      // Delete verification documents from Cloudinary
      if (verificationData.documents) {
        for (const docUrl of Object.values(verificationData.documents)) {
          if (typeof docUrl === 'string' && docUrl.includes('cloudinary.com')) {
            try {
              const publicId = docUrl.split('/').pop()?.split('.')[0];
              if (publicId) {
                await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/destroy`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    public_id: publicId,
                    api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
                    api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
                  }),
                });
              }
            } catch (error) {
              console.error('Error deleting verification document from Cloudinary:', error);
            }
          }
        }
      }
      await deleteDoc(doc.ref);
    }

    // 2. Delete user's messages from both Firestore and Supabase
    const messagesQuery = query(
      collection(db, 'messages'),
      where('senderId', '==', user.uid)
    );
    const messageDocs = await getDocs(messagesQuery);
    for (const doc of messageDocs.docs) {
      await deleteDoc(doc.ref);
    }

    // Delete messages from Supabase
    try {
      await supabase
        .from('messages')
        .delete()
        .eq('sender_id', user.uid);
    } catch (error) {
      console.error('Error deleting messages from Supabase:', error);
    }

    // 3. Delete user's notifications
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid)
    );
    const notificationDocs = await getDocs(notificationsQuery);
    for (const doc of notificationDocs.docs) {
      await deleteDoc(doc.ref);
    }

    // 4. Delete user's posts and their media from Cloudinary
    const postsQuery = query(
      collection(db, 'posts'),
      where('authorId', '==', user.uid)
    );
    const postDocs = await getDocs(postsQuery);
    for (const doc of postDocs.docs) {
      const postData = doc.data();
      // Delete post media from Cloudinary
      if (postData.media && Array.isArray(postData.media)) {
        for (const mediaItem of postData.media) {
          if (mediaItem.url && mediaItem.url.includes('cloudinary.com')) {
            try {
              const publicId = mediaItem.path || mediaItem.url.split('/').pop()?.split('.')[0];
              if (publicId) {
                await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/destroy`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    public_id: publicId,
                    api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
                    api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
                  }),
                });
              }
            } catch (error) {
              console.error('Error deleting post media from Cloudinary:', error);
            }
          }
        }
      }
      await deleteDoc(doc.ref);
    }

    // 5. Remove user from other users' followers/following/connections lists
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      const promises: Promise<void>[] = [];

      // Remove from followers' following list
      if (userData.followers?.length) {
        for (const followerId of userData.followers) {
          promises.push(
            updateDoc(doc(db, 'users', followerId), {
              following: arrayRemove(user.uid)
            })
          );
        }
      }

      // Remove from following users' followers list
      if (userData.following?.length) {
        for (const followingId of userData.following) {
          promises.push(
            updateDoc(doc(db, 'users', followingId), {
              followers: arrayRemove(user.uid)
            })
          );
        }
      }

      // Remove from connections
      if (userData.connections?.length) {
        for (const connectionId of userData.connections) {
          promises.push(
            updateDoc(doc(db, 'users', connectionId), {
              connections: arrayRemove(user.uid)
            })
          );
        }
      }

      await Promise.all(promises);
    }

    // 6. Delete user's profile picture from Cloudinary if it exists
    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      if (userData.photoURL && userData.photoURL.includes('cloudinary.com')) {
        try {
          const publicId = userData.photoURL.split('/').pop()?.split('.')[0];
          if (publicId) {
            await fetch(`https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME}/destroy`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                public_id: publicId,
                api_key: process.env.REACT_APP_CLOUDINARY_API_KEY,
                api_secret: process.env.REACT_APP_CLOUDINARY_API_SECRET,
              }),
            });
          }
        } catch (error) {
          console.error('Error deleting profile picture from Cloudinary:', error);
        }
      }
    }

    // 7. Delete user's presence data from Supabase
    try {
      await supabase
        .from('presence')
        .delete()
        .eq('user_id', user.uid);
    } catch (error) {
      console.error('Error deleting presence data from Supabase:', error);
    }

    // 8. Delete user document from Firestore
    await deleteDoc(userRef);

    // 9. Finally, delete the auth account
    await deleteUser(user);

    console.log('Account successfully deleted');
  } catch (error) {
    console.error('Error deleting account:', error);
    if (error instanceof Error && 'code' in error) {
      handleAuthError(error as AuthError);
    }
    throw error;
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