import {
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  DocumentData,
  onSnapshot,
  Unsubscribe,
  updateDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Message } from '../types/message';

export const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<Message> => {
  try {
    const timestamp = new Date().toISOString();
    const messageWithMetadata = {
      ...messageData,
      timestamp,
      read: false,
    };

    const docRef = await addDoc(collection(db, 'messages'), messageWithMetadata);
    return {
      id: docRef.id,
      ...messageWithMetadata,
    };
  } catch (error) {
    throw error;
  }
};

export const getConversation = async (userId1: string, userId2: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('senderId', 'in', [userId1, userId2]),
      where('recipientId', 'in', [userId1, userId2]),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
  } catch (error) {
    throw error;
  }
};

export const markMessageAsRead = async (messageId: string): Promise<void> => {
  try {
    await updateDoc(doc(db, 'messages', messageId), {
      read: true,
    });
  } catch (error) {
    throw error;
  }
};

export const getUnreadMessages = async (userId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('recipientId', '==', userId),
      where('read', '==', false),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Message[];
  } catch (error) {
    throw error;
  }
};

export const subscribeToMessages = (
  userId: string,
  callback: (messages: Message[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'messages'),
    where('participants', 'array-contains', userId),
    orderBy('timestamp', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach((doc: DocumentData) => {
      const messageData = doc.data() as Omit<Message, 'id'>;
      messages.push({ ...messageData, id: doc.id });
    });
    callback(messages);
  });
};

export const getRecentConversations = async (userId: string): Promise<Message[]> => {
  try {
    const q = query(
      collection(db, 'messages'),
      where('senderId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const querySnapshot = await getDocs(q);
    const conversations = new Map<string, Message>();

    querySnapshot.docs.forEach(doc => {
      const messageData = doc.data() as Omit<Message, 'id'>;
      if (!conversations.has(messageData.recipientId)) {
        conversations.set(messageData.recipientId, {
          id: doc.id,
          ...messageData,
        });
      }
    });

    return Array.from(conversations.values());
  } catch (error) {
    throw error;
  }
}; 