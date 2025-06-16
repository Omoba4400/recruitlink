import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  orderBy,
  limit,
  serverTimestamp,
  DocumentReference,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { 
  VerificationRequest, 
  VerificationDocument, 
  VerificationStatus,
  DocumentType,
  VerificationStats 
} from '../types/verification';
import { UserProfile } from '../types/user';
import { updateUserProfile } from './user.service';

const VERIFICATIONS_COLLECTION = 'verifications';
const VERIFICATION_DOCS_COLLECTION = 'verification_documents';

// Upload a verification document
export const uploadVerificationDocument = async (
  userId: string,
  file: File,
  type: DocumentType
): Promise<string> => {
  try {
    // Since we're not using Firebase Storage, we'll just create a verification document
    // with a placeholder URL. You might want to implement your own file storage solution here.
    const verificationDoc = {
      userId,
      type,
      fileName: file.name,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      status: 'pending' as VerificationStatus,
      fileUrl: '' // Placeholder for file URL from your chosen storage solution
    };

    const docRef = await addDoc(collection(db, VERIFICATION_DOCS_COLLECTION), verificationDoc);
    return docRef.id;
  } catch (error) {
    console.error('Error creating verification document:', error);
    throw error;
  }
};

// Submit a new verification request
export const submitVerificationRequest = async (
  userId: string,
  userType: 'athlete' | 'coach',
  documents: { file: File; type: DocumentType }[],
  data: {
    institutionName: string;
    studentId?: string;
    graduationYear?: string;
    sport?: string;
    position?: string;
  }
): Promise<string> => {
  try {
    // Upload all documents first
    const uploadPromises = documents.map(async ({ file, type }) => {
      const fileUrl = await uploadVerificationDocument(userId, file, type);
      
      const docData: Omit<VerificationDocument, 'id'> = {
        userId,
        type,
        fileUrl,
        fileName: file.name,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        status: 'approved' // Auto-approve for student ID
      };
      
      const docRef = await addDoc(collection(db, VERIFICATION_DOCS_COLLECTION), docData);
      return { ...docData, id: docRef.id };
    });
    
    const uploadedDocs = await Promise.all(uploadPromises);
    
    // Check if this is a student ID upload
    const hasStudentId = documents.some(doc => doc.type === 'studentId');
    const verificationStatus = hasStudentId ? 'approved' : 'pending';
    
    // Create verification request
    const verificationData: Omit<VerificationRequest, 'id'> = {
      userId,
      userType,
      submittedAt: new Date().toISOString(),
      status: verificationStatus,
      documents: uploadedDocs,
      institutionName: data.institutionName,
      studentId: data.studentId,
      graduationYear: data.graduationYear,
      sport: data.sport,
      position: data.position,
      updatedAt: new Date().toISOString()
    };
    
    const verificationRef = await addDoc(collection(db, VERIFICATIONS_COLLECTION), verificationData);
    
    // Update user profile verification status
    await updateUserProfile(userId, {
      verified: hasStudentId, // Auto-verify if student ID is uploaded
      verificationStatus: verificationStatus
    });
    
    return verificationRef.id;
  } catch (error) {
    console.error('Error submitting verification request:', error);
    throw error;
  }
};

// Get verification request by ID
export const getVerificationRequest = async (requestId: string): Promise<VerificationRequest | null> => {
  try {
    const verificationDoc = await getDoc(doc(db, VERIFICATIONS_COLLECTION, requestId));
    if (!verificationDoc.exists()) return null;
    
    return { id: verificationDoc.id, ...verificationDoc.data() } as VerificationRequest;
  } catch (error) {
    console.error('Error getting verification request:', error);
    throw error;
  }
};

// Get user's verification requests
export const getUserVerificationRequests = async (userId: string): Promise<VerificationRequest[]> => {
  try {
    const q = query(
      collection(db, VERIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('submittedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VerificationRequest);
  } catch (error) {
    console.error('Error getting user verification requests:', error);
    throw error;
  }
};

// Get pending verification requests (for admin)
export const getPendingVerifications = async (limit_?: number): Promise<VerificationRequest[]> => {
  try {
    const q = query(
      collection(db, VERIFICATIONS_COLLECTION),
      where('status', '==', 'pending'),
      orderBy('submittedAt', 'asc'),
      ...(limit_ ? [limit(limit_)] : [])
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as VerificationRequest);
  } catch (error) {
    console.error('Error getting pending verifications:', error);
    throw error;
  }
};

// Review verification request (admin only)
export const reviewVerificationRequest = async (
  requestId: string,
  adminId: string,
  decision: 'approved' | 'rejected',
  notes?: string
): Promise<void> => {
  try {
    const verificationRef = doc(db, VERIFICATIONS_COLLECTION, requestId);
    const verificationDoc = await getDoc(verificationRef);
    
    if (!verificationDoc.exists()) {
      throw new Error('Verification request not found');
    }
    
    const verification = verificationDoc.data() as VerificationRequest;
    
    // Update verification request
    await updateDoc(verificationRef, {
      status: decision,
      reviewedBy: adminId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: notes,
      updatedAt: new Date().toISOString()
    });
    
    // Update user profile verification status
    await updateUserProfile(verification.userId, {
      verified: decision === 'approved',
      verificationStatus: decision
    });
    
    // Update all associated documents
    const updatePromises = verification.documents.map(docRef =>
      updateDoc(doc(db, VERIFICATION_DOCS_COLLECTION, docRef.id), {
        status: decision,
        reviewedBy: adminId,
        reviewedAt: new Date().toISOString(),
        reviewNotes: notes
      })
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error('Error reviewing verification request:', error);
    throw error;
  }
};

// Get verification statistics (for admin dashboard)
export const getVerificationStats = async (): Promise<VerificationStats> => {
  try {
    const [pendingDocs, approvedDocs, rejectedDocs] = await Promise.all([
      getDocs(query(collection(db, VERIFICATIONS_COLLECTION), where('status', '==', 'pending'))),
      getDocs(query(collection(db, VERIFICATIONS_COLLECTION), where('status', '==', 'approved'))),
      getDocs(query(collection(db, VERIFICATIONS_COLLECTION), where('status', '==', 'rejected')))
    ]);
    
    // Calculate average response time for completed verifications
    const completedDocs = [...approvedDocs.docs, ...rejectedDocs.docs];
    const totalResponseTime = completedDocs.reduce((acc, doc) => {
      const data = doc.data();
      if (data.reviewedAt && data.submittedAt) {
        const responseTime = new Date(data.reviewedAt).getTime() - new Date(data.submittedAt).getTime();
        return acc + responseTime;
      }
      return acc;
    }, 0);
    
    const averageResponseTime = completedDocs.length > 0
      ? (totalResponseTime / completedDocs.length) / (1000 * 60 * 60) // Convert to hours
      : 0;
    
    return {
      totalPending: pendingDocs.size,
      totalApproved: approvedDocs.size,
      totalRejected: rejectedDocs.size,
      averageResponseTime
    };
  } catch (error) {
    console.error('Error getting verification stats:', error);
    throw error;
  }
}; 