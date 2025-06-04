import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
} from '@mui/material';

const Users: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          User management functionality will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Users; 