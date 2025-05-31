import {
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  arrayUnion,
  arrayRemove,
  DocumentData,
  getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Event, User } from '../types';

export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> => {
  try {
    const timestamp = new Date().toISOString();
    const eventWithTimestamp = {
      ...eventData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    const docRef = await addDoc(collection(db, 'events'), eventWithTimestamp);
    return {
      id: docRef.id,
      ...eventWithTimestamp,
    };
  } catch (error) {
    throw error;
  }
};

export const getEvent = async (eventId: string): Promise<Event | null> => {
  try {
    const eventDoc = await getDoc(doc(db, 'events', eventId));
    if (eventDoc.exists()) {
      return {
        id: eventDoc.id,
        ...eventDoc.data(),
      } as Event;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const getEvents = async (user: User): Promise<Event[]> => {
  const q = query(
    collection(db, 'events'),
    orderBy('date', 'asc')
  );
  
  const snapshot = await getDocs(q);
  const events: Event[] = [];
  
  snapshot.forEach((doc: DocumentData) => {
    const eventData = doc.data() as Omit<Event, 'id'>;
    
    // Filter events based on visibility and user's connections/following
    if (
      eventData.visibility === 'public' ||
      (eventData.visibility === 'connections' && user.connections.includes(eventData.creatorId)) ||
      (eventData.visibility === 'followers' && user.following.includes(eventData.creatorId)) ||
      eventData.creatorId === user.id
    ) {
      events.push({ ...eventData, id: doc.id });
    }
  });
  
  return events;
};

export const updateEvent = async (eventId: string, updates: Partial<Omit<Event, 'id' | 'createdAt'>>): Promise<void> => {
  try {
    const timestamp = new Date().toISOString();
    await updateDoc(doc(db, 'events', eventId), {
      ...updates,
      updatedAt: timestamp,
    });
  } catch (error) {
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    throw error;
  }
};

export const attendEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    attendees: arrayUnion(userId)
  });
};

export const unattendEvent = async (
  eventId: string,
  userId: string
): Promise<void> => {
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, {
    attendees: arrayRemove(userId)
  });
};

export const getUpcomingEvents = async (user: User): Promise<Event[]> => {
  const now = new Date().toISOString();
  const q = query(
    collection(db, 'events'),
    where('date', '>=', now),
    orderBy('date', 'asc')
  );
  
  const snapshot = await getDocs(q);
  const events: Event[] = [];
  
  snapshot.forEach((doc: DocumentData) => {
    const eventData = doc.data() as Omit<Event, 'id'>;
    
    if (
      eventData.visibility === 'public' ||
      (eventData.visibility === 'connections' && user.connections.includes(eventData.creatorId)) ||
      (eventData.visibility === 'followers' && user.following.includes(eventData.creatorId)) ||
      eventData.creatorId === user.id
    ) {
      events.push({ ...eventData, id: doc.id });
    }
  });
  
  return events;
};

export const getEventsByOrganizer = async (organizerId: string): Promise<Event[]> => {
  try {
    const q = query(collection(db, 'events'), where('organizer', '==', organizerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  } catch (error) {
    throw error;
  }
};

export const getEventsBySport = async (sport: string): Promise<Event[]> => {
  try {
    const q = query(collection(db, 'events'), where('sport', '==', sport));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Event[];
  } catch (error) {
    throw error;
  }
}; 