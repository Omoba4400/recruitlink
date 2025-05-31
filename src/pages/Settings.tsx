import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Switch,
  TextField,
  Button,
  Avatar,
  IconButton,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  Alert,
  Tab,
  Tabs,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  Person,
  Lock,
  Notifications,
  Security,
  Palette,
  Help,
  Info,
  Email,
  Phone,
  PhotoCamera,
  Delete,
  Block,
  Language,
  Home,
  BugReport,
  PrivacyTip,
  Verified,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../store';
import Header from '../components/layout/Header';
import { useThemeContext } from '../contexts/ThemeContext';
import { deleteUserAccount } from '../services/auth.service';
import { useSnackbar } from 'notistack';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState(0);
  const user = useSelector((state: RootState) => state.auth.user);
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { darkMode, toggleDarkMode } = useThemeContext();
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteError(null);
      
      if (!deleteEmail || !deletePassword) {
        setDeleteError('Please enter your email and password');
        return;
      }

      await deleteUserAccount(deleteEmail, deletePassword);
      enqueueSnackbar('Account deleted successfully', { variant: 'success' });
      navigate('/');
    } catch (error: any) {
      console.error('Error deleting account:', error);
      setDeleteError(error.message || 'Failed to delete account');
      enqueueSnackbar(error.message || 'Failed to delete account', { variant: 'error' });
    }
  };

  return (
    <Box>
      <Header />
      <Container maxWidth="lg" sx={{ mt: 10, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons={isMobile ? "auto" : false}
          >
            <Tab icon={<Person />} label="Account" />
            <Tab icon={<Notifications />} label="Notifications" />
            <Tab icon={<Security />} label="Privacy" />
            <Tab icon={<Palette />} label="Preferences" />
            <Tab icon={<Help />} label="Help" />
            <Tab icon={<Info />} label="About" />
          </Tabs>
        </Box>

        {/* Account Settings */}
        <TabPanel value={activeTab} index={0}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Profile Information</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 2 }}
                src={user?.photoURL || undefined}
              >
                {user?.displayName?.[0]}
              </Avatar>
              <IconButton color="primary" aria-label="upload picture" component="label">
                <input hidden accept="image/*" type="file" />
                <PhotoCamera />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField label="Display Name" defaultValue={user?.displayName} />
              <TextField label="Email" defaultValue={user?.email} />
              <TextField label="Phone Number" />
              <TextField label="Bio" multiline rows={4} />
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Password</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField type="password" label="Current Password" />
              <TextField type="password" label="New Password" />
              <TextField type="password" label="Confirm New Password" />
              <Button variant="contained" color="primary">
                Update Password
              </Button>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, mt: 3, bgcolor: 'error.light' }}>
            <Typography variant="h6" color="error.contrastText">
              Danger Zone
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => setOpenDeleteDialog(true)}
              >
                Delete Account
              </Button>
            </Box>
          </Paper>
        </TabPanel>

        {/* Notification Settings */}
        <TabPanel value={activeTab} index={1}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Push Notifications</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Event Updates" secondary="Match invites, new sponsorships" />
                <Switch checked={pushNotifications} onChange={(e) => setPushNotifications(e.target.checked)} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Messages" secondary="Direct messages and connection requests" />
                <Switch defaultChecked />
              </ListItem>
              <ListItem>
                <ListItemText primary="Follower Activity" secondary="New followers and interactions" />
                <Switch defaultChecked />
              </ListItem>
              <ListItem>
                <ListItemText primary="App Updates" secondary="New features and tips" />
                <Switch defaultChecked />
              </ListItem>
            </List>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Email Notifications</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Newsletter" secondary="Weekly updates and news" />
                <Switch checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
              </ListItem>
              <ListItem>
                <ListItemText primary="Marketing" secondary="Promotions and special offers" />
                <Switch />
              </ListItem>
            </List>
          </Paper>
        </TabPanel>

        {/* Privacy & Security */}
        <TabPanel value={activeTab} index={2}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Privacy Settings</Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>Who Can View My Profile</Typography>
              <Select defaultValue="public">
                <MenuItem value="public">Everyone</MenuItem>
                <MenuItem value="connections">Only Connections</MenuItem>
                <MenuItem value="teams">Teams Only</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Security</Typography>
            <List>
              <ListItem>
                <ListItemIcon><Verified /></ListItemIcon>
                <ListItemText primary="Two-Factor Authentication" secondary="Add an extra layer of security" />
                <Switch />
              </ListItem>
              <ListItemButton>
                <ListItemIcon><Block /></ListItemIcon>
                <ListItemText primary="Blocked Users" secondary="Manage blocked accounts" />
              </ListItemButton>
            </List>
          </Paper>
        </TabPanel>

        {/* App Preferences */}
        <TabPanel value={activeTab} index={3}>
          <Paper sx={{ p: 3 }}>
            <List>
              <ListItem>
                <ListItemIcon><Palette /></ListItemIcon>
                <ListItemText primary="Dark Mode" secondary="Toggle dark/light theme" />
                <Switch checked={darkMode} onChange={toggleDarkMode} />
              </ListItem>
              <ListItem>
                <ListItemIcon><Language /></ListItemIcon>
                <ListItemText primary="Language" />
                <Select defaultValue="en" size="small">
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                </Select>
              </ListItem>
              <ListItem>
                <ListItemIcon><Home /></ListItemIcon>
                <ListItemText primary="Default Home Tab" />
                <Select defaultValue="feed" size="small">
                  <MenuItem value="feed">Feed</MenuItem>
                  <MenuItem value="events">Events</MenuItem>
                  <MenuItem value="messages">Messages</MenuItem>
                </Select>
              </ListItem>
            </List>
          </Paper>
        </TabPanel>

        {/* Help & Support */}
        <TabPanel value={activeTab} index={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Help Center</Typography>
            <List>
              <ListItemButton>
                <ListItemIcon><Help /></ListItemIcon>
                <ListItemText primary="FAQs" secondary="Frequently asked questions" />
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon><BugReport /></ListItemIcon>
                <ListItemText primary="Report a Bug" secondary="Help us improve" />
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon><Email /></ListItemIcon>
                <ListItemText primary="Contact Support" secondary="Get help from our team" />
              </ListItemButton>
              <ListItemButton>
                <ListItemIcon><PrivacyTip /></ListItemIcon>
                <ListItemText primary="Terms & Privacy" secondary="Legal information" />
              </ListItemButton>
            </List>
          </Paper>
        </TabPanel>

        {/* About */}
        <TabPanel value={activeTab} index={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>About AthleteConnect</Typography>
            <List>
              <ListItem>
                <ListItemText primary="Version" secondary="1.0.0" />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="About Us" 
                  secondary="AthleteConnect is a platform designed to connect athletes, coaches, and sports organizations." 
                />
              </ListItem>
              <ListItem>
                <ListItemText primary="Developer" secondary="AthleteConnect Team" />
              </ListItem>
              <ListItem>
                <ListItemText primary="Open Source Licenses" secondary="View third-party licenses" />
              </ListItem>
            </List>
          </Paper>
        </TabPanel>

        {/* Delete Account Dialog */}
        <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
          <DialogTitle>Delete Account</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              This action cannot be undone. Please enter your email and password to confirm.
            </Typography>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={deleteEmail}
              onChange={(e) => setDeleteEmail(e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Password"
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              margin="normal"
            />
            {deleteError && (
              <Typography color="error" sx={{ mt: 1 }}>
                {deleteError}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
            <Button
              onClick={handleDeleteAccount}
              color="error"
              variant="contained"
            >
              Delete Account
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Settings; 