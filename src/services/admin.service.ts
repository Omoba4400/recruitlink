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
  setDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { User } from '../types/user';
import { UserProfile, UserType } from '../types/user';

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

// Helper function to check admin status
const checkAdminAccess = async (uid: string) => {
  const adminDoc = await getDocs(query(
    collection(db, 'users'),
    where('uid', '==', uid),
    where('isAdmin', '==', true)
  ));
  
  if (adminDoc.empty) {
    throw new Error('Unauthorized: Admin access required');
  }
};

export const getUsers = async (
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
  pageSize: number = 10
): Promise<PaginatedResponse<User>> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    // Verify admin access
    await checkAdminAccess(currentUser.uid);

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

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
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
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('Not authenticated');
    }

    // Verify admin access
    await checkAdminAccess(currentUser.uid);

    // Get all counts using getDocs
    const [
      usersSnapshot,
      verificationSnapshot,
      reportsSnapshot,
      eventsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(query(
        collection(db, 'verifications'),
        where('status', '==', 'pending')
      )),
      getDocs(query(
        collection(db, 'reports'),
        where('status', '==', 'pending')
      )),
      getDocs(query(
        collection(db, 'events'),
        where('status', '==', 'active')
      ))
    ]);

    const stats = {
      totalUsers: usersSnapshot.size,
      pendingVerifications: verificationSnapshot.size,
      pendingReports: reportsSnapshot.size,
      activeEvents: eventsSnapshot.size,
      lastUpdated: new Date().toISOString()
    };

    // Try to update analytics, create if doesn't exist
    try {
      const analyticsRef = doc(db, 'analytics', 'daily_stats');
      const analyticsDoc = await getDoc(analyticsRef);
      
      if (!analyticsDoc.exists()) {
        // Document doesn't exist, create it
        await setDoc(analyticsRef, {
          ...stats,
          createdAt: new Date().toISOString()
        });
      } else {
        // Document exists, update it
        await updateDoc(analyticsRef, stats);
      }
    } catch (analyticsError) {
      console.warn('Failed to update analytics, but stats were retrieved:', analyticsError);
    }

    return stats;
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error; // Let the component handle the error
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

const USERS_COLLECTION = 'users';

export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersQuery = query(
      collection(db, USERS_COLLECTION),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(usersQuery);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt
      } as UserProfile;
    });
  } catch (error) {
    console.error('Error getting all users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const updateUserRole = async (userId: string, newRole: UserType): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      userType: newRole,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
};

export const verifyUser = async (userId: string): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      verified: true,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error verifying user:', error);
    throw new Error('Failed to verify user');
  }
};

export const blockUser = async (userId: string, blocked: boolean): Promise<void> => {
  try {
    const userRef = doc(db, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      blocked,
      updatedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error updating user block status:', error);
    throw new Error('Failed to update user block status');
  }
}; 