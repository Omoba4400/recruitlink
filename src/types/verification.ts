export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type DocumentType = 'studentId' | 'athleteId' | 'transcript' | 'other';

export interface VerificationDocument {
  id: string;
  userId: string;
  type: DocumentType;
  fileUrl: string;
  fileName: string;
  mimeType: string;
  uploadedAt: string;
  status: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userType: 'athlete' | 'coach';
  submittedAt: string;
  status: VerificationStatus;
  documents: VerificationDocument[];
  institutionName: string;
  studentId?: string;
  graduationYear?: string;
  sport?: string;
  position?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  updatedAt: string;
}

export interface VerificationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageResponseTime: number; // in hours
} 