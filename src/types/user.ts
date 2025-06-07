export type UserType = 'athlete' | 'coach' | 'team' | 'sponsor' | 'media' | 'fan' | 'college';

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
  organization: string;
  canMessageAthletes: boolean;
  coverageAreas: string[];
  mediaType: string[];
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
  userType: UserType;
  photoURL?: string;
  bio: string;
  location: string;
  verified: boolean;
  verificationStatus: 'none' | 'pending' | 'approved' | 'rejected';
  verificationId?: string; // Reference to the latest verification request
  createdAt: string;
  updatedAt: string;
  socialLinks: SocialLinks;
  privacySettings: PrivacySettings;
  posts?: Post[];
  groups?: string[];
  followers: string[];
  following: string[];
  connections: string[];
  matchScore?: number;
  // Role-specific information
  athleteInfo?: AthleteInfo;
  coachInfo?: CoachInfo;
  teamInfo?: TeamInfo;
  sponsorInfo?: SponsorInfo;
  mediaInfo?: MediaInfo;
  collegeInfo?: CollegeInfo;
}

// Full user interface including auth-related fields
export interface User extends UserProfile {
  id: string;
  emailVerified: boolean;
  lastLogin: string;
  isAdmin?: boolean;
  blockedUsers?: string[];
  messageThreads?: string[];
} 