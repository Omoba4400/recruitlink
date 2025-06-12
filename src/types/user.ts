export type UserType = 'athlete' | 'coach' | 'team' | 'sponsor' | 'media' | 'fan' | 'college' | 'admin';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  youtube?: string;
  facebook?: string;
  website?: string;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  mediaUrls?: string[];
  likes: string[];
  comments: Comment[];
  reposts: string[];
  createdAt: string;
  updatedAt: string;
  visibility: 'public' | 'connections' | 'private';
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  likes: string[];
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private' | 'connections';
  allowMessagesFrom: 'everyone' | 'connections' | 'none';
  showEmail: boolean;
  showLocation: boolean;
  showAcademicInfo: boolean;
  showAthleteStats: boolean;
}

export interface AcademicInfo {
  currentSchool: string;
  graduationYear: string;
  gpa?: number;
  major?: string;
  minor?: string;
  academicAchievements?: string[];
  studentId?: string;
}

export interface AthleteStats {
  sport: string;
  position: string;
  level: string;
  experience: number;
  specialties: string[];
  achievements: string[];
}

export interface AthleteMedia {
  type: 'video' | 'image';
  url: string;
  title: string;
  description?: string;
  uploadDate: string;
  thumbnail?: string;
  tags?: string[];
}

export interface Membership {
  organizationId: string;
  organizationType: 'team' | 'club' | 'college';
  role: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}

export interface AthleteInfo {
  sports: AthleteStats[];
  academicInfo: AcademicInfo;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verificationDocuments?: {
    studentId?: string;
    athleteId?: string;
    otherDocuments?: string[];
  };
  media: string[];
  memberships: string[];
  interests: string[];
  activities: string[];
  awards: string[];
  achievements: string[];
  eligibility: {
    isEligible: boolean;
  };
  recruitingStatus: 'open' | 'closed' | 'committed';
  preferredRegions?: string[];
  stats?: Record<string, string | number>;
}

export interface CoachInfo {
  specialization: string[];
  experience: string;
  certifications: string[];
  canMessageAthletes: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  currentTeam?: string;
}

export interface TeamInfo {
  teamName: string;
  sport: string;
  canMessageAthletes: boolean;
  achievements: string[];
  roster: string[];
  openPositions: string[];
}

export interface SponsorInfo {
  companyName: string;
  industry: string;
  canMessageAthletes: boolean;
  sponsorshipTypes: string[];
  activeOpportunities: {
    title: string;
    description: string;
    requirements?: string[];
  }[];
}

export interface MediaInfo {
  companyName: string;
  website?: string;
  coverageAreas?: string[];
  mediaType?: string[];
  credentials?: {
    type: string;
    issuer: string;
    expiryDate: string;
  }[];
}

export interface CollegeInfo {
  name: string;
  location: string;
  division: string;
  conference: string;
  sports: string[];
  admissionRequirements?: {
    gpa?: number;
    sat?: number;
    act?: number;
    otherRequirements?: string[];
  };
  athleticScholarships?: {
    available: boolean;
    types?: string[];
    requirements?: string[];
  };
}

// Base profile interface
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bannerURL?: string;
  userType: UserType;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  bio: string;
  location: string;
  verified: boolean;
  blocked: boolean;
  emailVerified: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  isAdmin: boolean;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  privacySettings: {
    profileVisibility: 'public' | 'private' | 'connections';
    allowMessagesFrom: 'everyone' | 'connections' | 'none';
    showEmail: boolean;
    showLocation: boolean;
    showAcademicInfo: boolean;
    showAthleteStats: boolean;
  };
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
    youtube: string;
  };
  followers: string[];
  following: string[];
  connections: string[];
  athleteInfo?: AthleteInfo;
  coachInfo?: CoachInfo;
  teamInfo?: TeamInfo;
  sponsorInfo?: SponsorInfo;
  mediaInfo?: MediaInfo;
  matchScore?: number;
  collegeInfo?: CollegeInfo;
}

// Full user interface including auth-related fields
export interface User extends UserProfile {
  id: string;
  blockedUsers?: string[];
  messageThreads?: string[];
}

export interface ConnectionRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
} 