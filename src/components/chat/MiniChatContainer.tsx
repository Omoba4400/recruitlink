import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { Box } from '@mui/material';
import MiniChat from './MiniChat';

interface ActiveChat {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
}

interface MiniChatContainerProps {
  userId: string;
}

export interface MiniChatContainerRef {
  openChat: (chat: ActiveChat) => void;
}

const MiniChatContainer = forwardRef<MiniChatContainerRef, MiniChatContainerProps>(
  ({ userId }, ref) => {
    const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);

    const handleCloseChat = (recipientId: string) => {
      setActiveChats((prevChats) =>
        prevChats.filter((chat) => chat.recipientId !== recipientId)
      );
    };

    const openChat = (chat: ActiveChat) => {
      setActiveChats((prevChats) => {
        // If chat is already open, don't add it again
        if (prevChats.some((c) => c.recipientId === chat.recipientId)) {
          return prevChats;
        }
        // Limit the number of open chats (e.g., to 3)
        const maxChats = 3;
        const newChats = [...prevChats, chat].slice(-maxChats);
        return newChats;
      });
    };

    useImperativeHandle(ref, () => ({
      openChat,
    }));

    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          right: 20,
          display: 'flex',
          gap: 2,
          zIndex: 1000,
        }}
      >
        {activeChats.map((chat) => (
          <MiniChat
            key={chat.recipientId}
            recipientId={chat.recipientId}
            recipientName={chat.recipientName}
            recipientAvatar={chat.recipientAvatar}
            userId={userId}
            onClose={() => handleCloseChat(chat.recipientId)}
          />
        ))}
      </Box>
    );
  }
);

export default MiniChatContainer; 