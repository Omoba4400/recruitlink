import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
} from '@mui/material';

const Reports: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Reports
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Typography>
          Report management and analytics will be implemented here.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Reports; 