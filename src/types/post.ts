import { Timestamp } from 'firebase/firestore';
import { User, UserProfile } from './user';

export type ReactionType = 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' | 'share';

export interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  path: string;
  filename: string;
}

export interface Reaction {
  userId: string;
  type: ReactionType;
  createdAt: Timestamp;
}

export interface Comment {
  id: string;
  userId: string;
  content: string;
  reactions: Reaction[];
  createdAt: Timestamp;
  isEdited: boolean;
}

export interface Post {
  id: string;
  authorId: string;
  content: string;
  media?: MediaItem[];
  reactions: Reaction[];
  comments: Comment[];
  shares: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isEdited: boolean;
  visibility: 'public' | 'followers' | 'connections' | 'private';
  tags?: string[];
  mentions?: string[];
  hashtags?: string[];
}

export interface PostWithAuthor extends Omit<Post, 'authorId'> {
  id: string;
  author: UserProfile;
}

export interface PostStats {
  reactionCounts: {
    [key: string]: number;
  };
  commentCount: number;
  shareCount: number;
  viewCount: number;
}

export interface PostFilter {
  visibility?: Post['visibility'];
  tags?: string[];
  authorId?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'recent' | 'popular' | 'trending';
}

export interface PostSearchResult {
  posts: PostWithAuthor[];
  lastVisible: any;
  hasMore: boolean;
  total: number;
}

export interface Author {
  id: string;
  displayName: string;
  userType: string;
  photoURL?: string;
  isVerified?: boolean;
}

export interface FeedItem {
  id: string;
  postId: string;
  authorId: string;
  createdAt: Timestamp;
  type: 'post';
} 