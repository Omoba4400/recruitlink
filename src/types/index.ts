export type { User, UserType, SocialLinks } from './user';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  organizer: string;
  organizerType: 'athlete' | 'coach' | 'team' | 'company';
  participants: string[];
  sport: string;
  type: 'tournament' | 'training' | 'meetup' | 'other';
  createdAt: string;
  updatedAt: string;
  visibility: 'public' | 'connections' | 'followers';
  creatorId: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userType: 'athlete' | 'coach' | 'team' | 'company';
  content: string;
  media?: string[];
  likes: string[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
}

export interface AuthState {
  user: import('./user').User | null;
  loading: boolean;
  error: string | null;
}

export interface RootState {
  auth: AuthState;
} 