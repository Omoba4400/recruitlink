import React from 'react';
import { Message } from '@mui/icons-material';
import { IconButton } from '@mui/material';

interface MessageIconProps {
  onClick?: () => void;
}

const MessageIcon: React.FC<MessageIconProps> = ({ onClick }) => {
  return (
    <IconButton onClick={onClick} color="inherit">
      <Message />
    </IconButton>
  );
};

export default MessageIcon; 