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
  Alert,
} from '@mui/material';
import {
  People as UsersIcon,
  Report as ReportsIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { getAdminStats } from '../../services/admin.service';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface DashboardCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

const Dashboard: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAdminAuth();
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
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard statistics');
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch stats when auth is initialized and we are admin
    if (!authLoading && isAdmin) {
      fetchStats();
    }
  }, [authLoading, isAdmin]);

  // Show loading state while auth is initializing
  if (authLoading) {
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

  // Show message if not admin
  if (!isAdmin) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          You do not have permission to access this page
        </Alert>
      </Box>
    );
  }

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
        <Alert severity="error" 
          action={
            <IconButton onClick={fetchStats} color="inherit" size="small">
              <RefreshIcon />
            </IconButton>
          }
        >
          {error}
        </Alert>
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
    {
      title: 'Pending Verifications',
      value: stats?.pendingVerifications || 0,
      icon: <UsersIcon fontSize="large" />,
      color: theme.palette.info.main,
    },
    {
      title: 'Active Events',
      value: stats?.activeEvents || 0,
      icon: <ReportsIcon fontSize="large" />,
      color: theme.palette.success.main,
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
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
          <Grid item xs={12} sm={6} md={3} key={index}>
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
    </Box>
  );
};

export default Dashboard; 