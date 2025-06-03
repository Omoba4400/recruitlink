import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { User } from '../types/user';

interface PaginatedResponse<T> {
  items: T[];
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  hasMore: boolean;
}

interface AdminStats {
  totalUsers: number;
  activeEvents: number;
  flaggedContent: number;
  pendingVerifications: number;
  dailyActiveUsers: number;
  monthlyActiveUsers: number;
}

export const getUsers = async (
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = 10
): Promise<PaginatedResponse<User>> => {
  try {
    let usersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      usersQuery = query(usersQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(usersQuery);
    const users = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as User[];

    const hasMore = users.length > pageSize;
    if (hasMore) {
      users.pop(); // Remove the extra item we used to check for more
    }

    return {
      items: users,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
};

export const updateUserStatus = async (
  userId: string,
  updates: Partial<Pick<User, 'verified' | 'isAdmin'>>
) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getFlaggedContent = async (
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = 10
): Promise<PaginatedResponse<any>> => {
  try {
    let reportsQuery = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(pageSize + 1)
    );

    if (lastDoc) {
      reportsQuery = query(reportsQuery, startAfter(lastDoc));
    }

    const snapshot = await getDocs(reportsQuery);
    const reports = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    }));

    const hasMore = reports.length > pageSize;
    if (hasMore) {
      reports.pop();
    }

    return {
      items: reports,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching flagged content:', error);
    throw error;
  }
};

export const getAdminStats = async () => {
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const reportsSnapshot = await getDocs(
      query(collection(db, 'reports'), where('status', '==', 'pending'))
    );

    return {
      totalUsers: usersSnapshot.size,
      pendingReports: reportsSnapshot.size,
      // Add more stats as needed
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
};

export const resolveReport = async (
  reportId: string,
  resolution: 'approve' | 'reject'
) => {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status: resolution === 'approve' ? 'resolved' : 'rejected',
      resolvedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    throw error;
  }
}; 