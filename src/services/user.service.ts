import {
  doc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDoc,
  DocumentData,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, UserProfile } from '../types/user';

export const getUserById = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    return null;
  }
  const userData = userDoc.data() as User;
  return userData;
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error getting user profile:', errorMessage);
    throw error;
  }
};

export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const timestamp = new Date().toISOString();
    
    await updateDoc(userRef, {
      ...data,
      updatedAt: timestamp,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error updating user profile:', errorMessage);
    throw error;
  }
};

export const updateSocialLinks = async (userId: string, socialLinks: User['socialLinks']): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      socialLinks,
      updatedAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error updating social links:', errorMessage);
    throw error;
  }
};

export const searchUsers = async (searchTerm: string, userType?: User['userType']): Promise<User[]> => {
  try {
    const q = query(
      collection(db, 'users'),
      ...(userType ? [where('userType', '==', userType)] : [])
    );
    
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    
    querySnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      if (
        userData.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userData.email?.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        users.push(userData);
      }
    });
    
    return users;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error searching users:', errorMessage);
    throw error;
  }
};

export const connectWithUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await updateDoc(currentUserRef, {
    connections: arrayUnion(targetUserId)
  });
  
  await updateDoc(targetUserRef, {
    connections: arrayUnion(currentUserId)
  });
};

export const disconnectFromUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await updateDoc(currentUserRef, {
    connections: arrayRemove(targetUserId)
  });
  
  await updateDoc(targetUserRef, {
    connections: arrayRemove(currentUserId)
  });
};

export const followUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await updateDoc(currentUserRef, {
    following: arrayUnion(targetUserId)
  });
  
  await updateDoc(targetUserRef, {
    followers: arrayUnion(currentUserId)
  });
};

export const unfollowUser = async (
  currentUserId: string,
  targetUserId: string
): Promise<void> => {
  const currentUserRef = doc(db, 'users', currentUserId);
  const targetUserRef = doc(db, 'users', targetUserId);
  
  await updateDoc(currentUserRef, {
    following: arrayRemove(targetUserId)
  });
  
  await updateDoc(targetUserRef, {
    followers: arrayRemove(currentUserId)
  });
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
      ...(data.teamInfo && { teamInfo: data.teamInfo }),
      ...(data.sponsorInfo && { sponsorInfo: data.sponsorInfo }),
      ...(data.mediaInfo && { mediaInfo: data.mediaInfo })
    };

    await setDoc(userRef, userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const createUserProfileIfNotExists = async (user: User): Promise<UserProfile> => {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const profileData: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        userType: user.userType,
        photoURL: user.photoURL || '',
        bio: user.bio || '',
        location: user.location || '',
        verified: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verificationStatus: 'none',
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
        },
        socialLinks: {
          twitter: user.socialLinks?.twitter || '',
          instagram: user.socialLinks?.instagram || '',
          linkedin: user.socialLinks?.linkedin || '',
          youtube: user.socialLinks?.youtube || '',
        },
        ...(user.userType === 'athlete' && {
          athleteInfo: {
            sports: [{
              sport: user.athleteInfo?.sports[0]?.sport || 'Not specified',
              position: user.athleteInfo?.sports[0]?.position || 'Not specified',
              level: 'Not specified',
              experience: 0,
              specialties: [],
              achievements: []
            }],
            academicInfo: {
              currentSchool: '',
              graduationYear: '',
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
        }),
        ...(user.userType === 'coach' && {
          coachInfo: {
            specialization: user.coachInfo?.specialization || [],
            experience: user.coachInfo?.experience || '',
            certifications: user.coachInfo?.certifications || [],
            canMessageAthletes: false,
            verificationStatus: 'pending'
          }
        }),
        ...(user.userType === 'team' && {
          teamInfo: {
            teamName: user.teamInfo?.teamName || '',
            sport: user.teamInfo?.sport || '',
            canMessageAthletes: false,
            achievements: [],
            roster: [],
            openPositions: []
          }
        })
      };

      const cleanProfileData = JSON.parse(JSON.stringify(profileData));
      await setDoc(userRef, cleanProfileData);
      return cleanProfileData;
    }

    return userSnap.data() as UserProfile;
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getTypeSpecificFields = (userType: User['userType']) => {
  switch (userType) {
    case 'athlete':
      return ['sport', 'position', 'graduationYear'];
    case 'college':
      return ['institutionName', 'division', 'programs'];
    case 'team':
      return ['teamName', 'sport', 'level'];
    case 'coach':
      return ['specialization', 'experience', 'certifications'];
    case 'sponsor':
      return ['companyName', 'industry', 'sponsorshipTypes'];
    case 'media':
      return ['organization', 'coverageAreas', 'mediaType'];
    case 'fan':
      return ['interests', 'favoriteTeams'];
    default:
      return [];
  }
};

export const updateUserData = async (userId: string, userData: Partial<User>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    const updatedData = {
      ...userData,
      updatedAt: new Date().toISOString()
    };
    await updateDoc(userRef, updatedData);
  } catch (error) {
    console.error('Error updating user data:', error);
    throw error;
  }
}; 