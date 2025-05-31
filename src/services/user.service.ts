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
  DocumentData
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types';

export const getUserById = async (userId: string): Promise<User | null> => {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    return null;
  }
  return { ...userDoc.data() as Omit<User, 'id'>, id: userId };
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    console.log('Fetching user profile for:', uid);
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data() as DocumentData;
      
      // Helper function to safely convert array data
      const toStringArray = (value: unknown): string[] => {
        if (Array.isArray(value)) {
          return value.map(item => String(item));
        }
        return [];
      };

      // Ensure required fields have default values
      const user: User = {
        id: uid,
        uid,
        email: data.email || '',
        displayName: data.displayName || '',
        photoURL: data.photoURL || null,
        userType: data.userType || 'athlete',
        createdAt: data.createdAt || new Date().toISOString(),
        lastLogin: data.lastLogin || new Date().toISOString(),
        bio: data.bio || '',
        location: data.location || '',
        isVerified: Boolean(data.isVerified),
        emailVerified: Boolean(data.emailVerified),
        isAdmin: Boolean(data.isAdmin),
        socialLinks: {
          instagram: data.socialLinks?.instagram || '',
          twitter: data.socialLinks?.twitter || '',
          linkedin: data.socialLinks?.linkedin || '',
          youtube: data.socialLinks?.youtube || '',
        },
        followers: toStringArray(data.followers),
        following: toStringArray(data.following),
        connections: toStringArray(data.connections),
        // Optional fields
        school: data.school || '',
        team: data.team || '',
        sport: data.sport || '',
        position: data.position || '',
        contactInfo: data.contactInfo || '',
        availability: data.availability || '',
        experience: data.experience || '',
        dateOfBirth: data.dateOfBirth || '',
        height: data.height || '',
        weight: data.weight || '',
        careerStats: data.careerStats || '',
        awards: data.awards || '',
        trainingSchedule: data.trainingSchedule || '',
        videos: Array.isArray(data.videos) ? data.videos : [],
        focus: data.focus || '',
        certifications: data.certifications || '',
        achievements: data.achievements || '',
        philosophy: data.philosophy || '',
        scoutedAthletes: Array.isArray(data.scoutedAthletes) ? data.scoutedAthletes : [],
        affiliation: data.affiliation || '',
        roster: data.roster || '',
        recentMatches: data.recentMatches || '',
        record: data.record || '',
        recruitingStatus: data.recruitingStatus || '',
        upcomingTryouts: data.upcomingTryouts || '',
        industry: data.industry || '',
        companyBio: data.companyBio || '',
        sponsorshipPrograms: data.sponsorshipPrograms || '',
        activeCampaigns: data.activeCampaigns || '',
        collaborations: data.collaborations || '',
        socialProof: data.socialProof || '',
      };

      console.log('Fetched user data:', user);
      return user;
    }
    console.log('No user document found for:', uid);
    return null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, updates: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', uid), updates);
  } catch (error) {
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
  } catch (error) {
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