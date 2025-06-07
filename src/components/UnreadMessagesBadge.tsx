import React, { useState, useEffect } from 'react';
import { Badge } from '@mui/material';
import { Message } from '@mui/icons-material';
import { messageService } from '../services/messageService';
import { useSelector } from 'react-redux';
import { RootState } from '../store';

interface UnreadMessagesBadgeProps {
  onClick?: () => void;
}

const UnreadMessagesBadge: React.FC<UnreadMessagesBadgeProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user?.uid) return;

    const loadUnreadCount = async () => {
      try {
        const count = await messageService.getUnreadCount(user.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error('Error loading unread count:', error);
      }
    };

    loadUnreadCount();

    // Subscribe to conversations to update unread count
    const unsubscribe = messageService.subscribeToConversations(user.uid, async () => {
      // Reload unread count when conversations update
      loadUnreadCount();
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return (
    <Badge badgeContent={unreadCount} color="error">
      <Message />
    </Badge>
  );
};

export default UnreadMessagesBadge; 