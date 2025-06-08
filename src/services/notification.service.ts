import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  limit as firestoreLimit,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Notification, NotificationWithSender } from '../types/notification';
import { getUserProfile } from './user.service';

const NOTIFICATIONS_COLLECTION = 'notifications';

export const getNotifications = async (userId: string, limitCount?: number): Promise<NotificationWithSender[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
    ];

    if (limitCount) {
      constraints.push(firestoreLimit(limitCount));
    }

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      ...constraints
    );

    const snapshot = await getDocs(q);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Notification[];

    // Fetch sender details for notifications that have senderId
    const notificationsWithSenders = await Promise.all(
      notifications.map(async (notification) => {
        if (notification.senderId) {
          const sender = await getUserProfile(notification.senderId);
          return {
            ...notification,
            sender: sender ? {
              id: sender.uid,
              displayName: sender.displayName,
              photoURL: sender.photoURL,
              userType: sender.userType,
            } : undefined,
          };
        }
        return notification;
      })
    );

    return notificationsWithSenders;
  } catch (error) {
    console.error('Error getting notifications:', error);
    throw error;
  }
};

export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  content: string,
  additionalData?: Partial<Notification>
): Promise<void> => {
  try {
    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
      userId,
      type,
      title,
      content,
      read: false,
      createdAt: new Date().toISOString(),
      ...additionalData,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const notificationRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(notificationRef, {
      read: true,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
  try {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}; 