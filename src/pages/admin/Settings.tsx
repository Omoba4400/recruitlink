import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  Paper,
  Container,
  Switch,
  FormGroup,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  SelectChangeEvent,
  Button,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import GroupIcon from '@mui/icons-material/Group';
import PublicIcon from '@mui/icons-material/Public';
import SaveIcon from '@mui/icons-material/Save';
import { RootState, AppDispatch } from '../../store/store';
import {
  fetchPrivacySettings,
  savePrivacySettings,
  updateSettings,
  resetSaveStatus,
  PrivacySettings,
} from '../../store/slices/privacySlice';

interface PrivacyOption {
  id: string;
  label: string;
  description: string;
  value: 'public' | 'connections' | 'private';
}

const Settings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { settings, loading, error, saveStatus } = useSelector((state: RootState) => state.privacy);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchPrivacySettings(user.id));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    if (saveStatus === 'succeeded') {
      const timer = setTimeout(() => {
        dispatch(resetSaveStatus());
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus, dispatch]);

  const privacyOptions: PrivacyOption[] = [
    { id: 'public', label: 'Everyone', description: 'Visible to anyone on SportFWD', value: 'public' },
    { id: 'connections', label: 'Connections Only', description: 'Only visible to your connections', value: 'connections' },
    { id: 'private', label: 'Private', description: 'Only visible to you', value: 'private' },
  ];

  const handlePrivacyChange = (setting: keyof PrivacySettings) => (event: SelectChangeEvent) => {
    dispatch(updateSettings({ [setting]: event.target.value }));
  };

  const handleToggleChange = (setting: keyof PrivacySettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(updateSettings({ [setting]: event.target.checked }));
  };

  const handleSave = async () => {
    if (user?.id) {
      dispatch(savePrivacySettings({ userId: user.id, settings }));
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return <PublicIcon />;
      case 'connections':
        return <GroupIcon />;
      case 'private':
        return <LockIcon />;
      default:
        return <VisibilityIcon />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Privacy Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                Profile Visibility
                <Tooltip title="Control who can see your profile information">
                  <IconButton size="small">
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth margin="normal">
                    <InputLabel>Profile Visibility</InputLabel>
                    <Select
                      value={settings.profileVisibility}
                      onChange={handlePrivacyChange('profileVisibility')}
                      startAdornment={getVisibilityIcon(settings.profileVisibility)}
                    >
                      {privacyOptions.map((option) => (
                        <MenuItem key={option.id} value={option.value}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body1">{option.label}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Email Visibility</InputLabel>
                    <Select
                      value={settings.emailVisibility}
                      onChange={handlePrivacyChange('emailVisibility')}
                      startAdornment={getVisibilityIcon(settings.emailVisibility)}
                    >
                      {privacyOptions.map((option) => (
                        <MenuItem key={option.id} value={option.value}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body1">{option.label}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth margin="normal">
                    <InputLabel>Stats & Achievements Visibility</InputLabel>
                    <Select
                      value={settings.statsVisibility}
                      onChange={handlePrivacyChange('statsVisibility')}
                      startAdornment={getVisibilityIcon(settings.statsVisibility)}
                    >
                      {privacyOptions.map((option) => (
                        <MenuItem key={option.id} value={option.value}>
                          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body1">{option.label}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {option.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
                    Additional Settings
                  </Typography>
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowMessages}
                          onChange={handleToggleChange('allowMessages')}
                        />
                      }
                      label="Allow messages from non-connections"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowConnections}
                          onChange={handleToggleChange('allowConnections')}
                        />
                      }
                      label="Allow connection requests"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showOnlineStatus}
                          onChange={handleToggleChange('showOnlineStatus')}
                        />
                      }
                      label="Show when you're online"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.showLastActive}
                          onChange={handleToggleChange('showLastActive')}
                        />
                      }
                      label="Show last active status"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.allowProfileSearch}
                          onChange={handleToggleChange('allowProfileSearch')}
                        />
                      }
                      label="Allow profile to appear in search results"
                    />
                  </FormGroup>
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={saveStatus === 'loading'}
                  startIcon={saveStatus === 'loading' ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  {saveStatus === 'loading' ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={saveStatus === 'succeeded'}
        autoHideDuration={3000}
        onClose={() => dispatch(resetSaveStatus())}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Privacy settings saved successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings; 