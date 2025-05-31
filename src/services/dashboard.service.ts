import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event, Message, User } from '../types';

export const getUpcomingEvents = async (userId: string): Promise<Event[]> => {
  try {
    const eventsRef = collection(db, 'events');
    const now = Timestamp.now();
    
    // Get events where the user is a participant or the event is public
    const q = query(
      eventsRef,
      where('date', '>=', now),
      where('participants', 'array-contains', userId),
      orderBy('date', 'asc'),
      limit(4)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Event));
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }
};

export const getRecentMessages = async (userId: string): Promise<Message[]> => {
  try {
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
  } catch (error) {
    console.error('Error fetching recent messages:', error);
    return [];
  }
};

export const getNotifications = async (userId: string): Promise<any[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const getScholarshipMatches = async (userId: string): Promise<any[]> => {
  try {
    const scholarshipsRef = collection(db, 'scholarships');
    // Add logic to match scholarships based on user's sports, achievements, etc.
    const q = query(
      scholarshipsRef,
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching scholarship matches:', error);
    return [];
  }
};

export const getSponsorshipOpportunities = async (userId: string): Promise<any[]> => {
  try {
    const sponsorshipsRef = collection(db, 'sponsorships');
    // Add logic to match sponsorships based on user's profile, achievements, etc.
    const q = query(
      sponsorshipsRef,
      limit(5)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching sponsorship opportunities:', error);
    return [];
  }
}; 