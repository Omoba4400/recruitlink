import { Message } from './message';

export interface Group {
  id: string;
  name: string;
  description: string;
  sport: string;
  creatorId: string;
  members: string[];
  admins: string[];
  createdAt: string;
  updatedAt: string;
  photoURL?: string;
  isPrivate: boolean;
  maxMembers?: number;
  rules?: string[];
  tags?: string[];
}

export interface GroupMessage extends Message {
  groupId: string;
}

export interface GroupInvite {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  expiresAt?: string;
}

export interface JoinRequest {
  id: string;
  groupId: string;
  userId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
} 