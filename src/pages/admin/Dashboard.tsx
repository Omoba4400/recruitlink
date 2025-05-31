import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  People as UsersIcon,
  Report as ReportsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getAdminStats } from '../../services/admin.service';

interface DashboardCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getAdminStats();
      setStats(data);
      setError(null);
    } catch (error) {
      setError('Failed to fetch dashboard statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
        <IconButton onClick={fetchStats} color="primary">
          <RefreshIcon />
        </IconButton>
      </Box>
    );
  }

  const dashboardCards: DashboardCard[] = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: <UsersIcon fontSize="large" />,
      color: theme.palette.primary.main,
    },
    {
      title: 'Pending Reports',
      value: stats?.pendingReports || 0,
      icon: <ReportsIcon fontSize="large" />,
      color: theme.palette.warning.main,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Dashboard Overview
        </Typography>
        <IconButton onClick={fetchStats} size="large">
          <RefreshIcon />
        </IconButton>
      </Box>

      <Grid container spacing={3}>
        {dashboardCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      {card.title}
                    </Typography>
                    <Typography variant="h4">
                      {typeof card.value === 'number'
                        ? card.value.toLocaleString()
                        : card.value}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      backgroundColor: `${card.color}15`,
                      borderRadius: '50%',
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {React.cloneElement(card.icon as React.ReactElement, {
                      sx: { color: card.color },
                    })}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add more sections like recent activities, charts, etc. */}
    </Box>
  );
};

export default Dashboard; 