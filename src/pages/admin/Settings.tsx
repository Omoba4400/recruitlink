import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
} from '@mui/material';

const Settings: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Admin Settings
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Admin settings and configuration will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Settings; 