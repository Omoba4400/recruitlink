export type NotificationType = 
  | 'connection_request'
  | 'connection_accepted'
  | 'new_follower'
  | 'post_like'
  | 'post_comment'
  | 'new_message';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  // Additional fields for different notification types
  senderId?: string;    // For user-related notifications (connections, follows, messages)
  postId?: string;      // For post-related notifications
  commentId?: string;   // For comment notifications
  messageId?: string;   // For message notifications
  // Connection request specific fields
  receiverId?: string;
  status?: 'pending' | 'accepted' | 'rejected';
  updatedAt?: string;
}

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string;
    displayName: string;
    photoURL?: string;
    userType?: string;
  };
} 