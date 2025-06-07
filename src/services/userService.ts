import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  setDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../config/firebase';
import { User } from '../types/user';

export interface UserProfile extends User {
  displayName: string;
  photoURL?: string;
  email: string;
  createdAt: string;
  lastSeen?: Date;
  online?: boolean;
}

class UserService {
  // Get user profile
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', userId);
    const snapshot = await getDoc(userRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data();
      return {
        ...data,
        id: snapshot.id,
        createdAt: data.createdAt,
        lastSeen: data.lastSeen?.toDate(),
      } as UserProfile;
    }
    
    return null;
  }

  // Update user profile
  async updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, data);
  }

  // Search users
  async searchUsers(searchText: string, limit: number = 10): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      where('displayName', '>=', searchText),
      where('displayName', '<=', searchText + '\uf8ff')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
      createdAt: doc.data().createdAt,
      lastSeen: doc.data().lastSeen?.toDate(),
    } as UserProfile));
  }

  // Subscribe to user profile changes
  subscribeToUserProfile(userId: string, callback: (user: UserProfile | null) => void) {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        callback({
          ...data,
          id: snapshot.id,
          createdAt: data.createdAt,
          lastSeen: data.lastSeen?.toDate(),
        } as UserProfile);
      } else {
        callback(null);
      }
    });
  }

  // Get multiple user profiles
  async getUserProfiles(userIds: string[]): Promise<UserProfile[]> {
    const promises = userIds.map(id => this.getUserProfile(id));
    const profiles = await Promise.all(promises);
    return profiles.filter((profile): profile is UserProfile => profile !== null);
  }

  // Create or update user profile
  async createOrUpdateUser(user: FirebaseUser): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userData = {
      displayName: user.displayName || '',
      email: user.email,
      photoURL: user.photoURL || '',
      createdAt: user.metadata?.creationTime ? user.metadata.creationTime : new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };

    await setDoc(userRef, userData, { merge: true });
  }

  // Get user's contacts (users they've messaged with)
  async getUserContacts(userId: string): Promise<UserProfile[]> {
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    const contactIds = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const participants = doc.data().participants;
      participants.forEach((participantId: string) => {
        if (participantId !== userId) {
          contactIds.add(participantId);
        }
      });
    });

    return this.getUserProfiles(Array.from(contactIds));
  }
}

export const userService = new UserService(); 