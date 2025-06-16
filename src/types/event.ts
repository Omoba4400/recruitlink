/// <reference types="react" />

import { User } from './user';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  creatorId: string;
  visibility: 'public' | 'connections' | 'followers' | 'private';
  attendees: string[];
  createdAt: string;
  updatedAt: string;
  type: 'game' | 'practice' | 'tournament' | 'camp' | 'other';
  sport?: string;
  maxAttendees?: number;
  requirements?: string[];
  media?: string[];
  tags?: string[];
} 