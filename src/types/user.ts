export type UserType = 'athlete' | 'coach' | 'team' | 'company';

export interface SocialLinks {
  instagram: string;
  twitter: string;
  linkedin: string;
  youtube: string;
}

export interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  userType: UserType;
  createdAt: string;
  lastLogin: string;
  bio: string;
  location: string;
  isVerified: boolean;
  emailVerified?: boolean;
  isAdmin?: boolean;
  school?: string;
  team?: string;
  sport?: string;
  position?: string;
  socialLinks: SocialLinks;
  stats?: {
    gamesPlayed: number;
    goals: number;
    assists: number;
    points: number;
    monthlyProgress: Array<{
      month: string;
      value: number;
    }>;
  };
  followers: string[];
  following: string[];
  connections: string[];

  // Common fields
  contactInfo?: string;
  availability?: string;
  experience?: string;

  // Athlete-specific fields
  dateOfBirth?: string;
  height?: string;
  weight?: string;
  careerStats?: string;
  awards?: string;
  trainingSchedule?: string;
  videos?: string[];

  // Coach-specific fields
  focus?: string;
  certifications?: string;
  achievements?: string;
  philosophy?: string;
  scoutedAthletes?: string[];

  // Team-specific fields
  affiliation?: string;
  roster?: string;
  recentMatches?: string;
  record?: string;
  recruitingStatus?: string;
  upcomingTryouts?: string;

  // Company-specific fields
  industry?: string;
  companyBio?: string;
  sponsorshipPrograms?: string;
  activeCampaigns?: string;
  collaborations?: string;
  socialProof?: string;
}

export type UserRole = User['userType']; 