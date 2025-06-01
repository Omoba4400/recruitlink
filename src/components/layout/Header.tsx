import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Badge,
  Avatar,
  Box,
  Menu,
  MenuItem,
  styled,
  alpha,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  Notifications,
  Message,
  AccountCircle,
  Menu as MenuIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { User } from '../../types/user';
import { auth } from '../../config/firebase';
import { signOut } from 'firebase/auth';
import { clearUser } from '../../store/slices/authSlice';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '40ch',
    },
  },
}));

const Header = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user) as User | null;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  const handleSettingsClick = () => {
    handleMenuClose();
    navigate('/settings');
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      dispatch(clearUser());
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    handleMenuClose();
    if (user) {
      navigate(`/profile/${user.uid}`);
    }
  };

  const handleDashboardClick = () => {
    navigate('/home');
  };

  const handleHomeClick = () => {
    navigate('/');
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        {isMobile && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenuOpen}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <IconButton color="inherit" onClick={() => navigate('/home')}>
          <HomeIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ display: { xs: 'none', sm: 'block' }, ml: 1 }}
        >
          Athlete Connect
        </Typography>

        <Search>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search athletes, teams, events..."
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <Message />
            </Badge>
          </IconButton>
          <IconButton
            edge="end"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {user?.photoURL ? (
              <Avatar 
                src={user.photoURL}
                sx={{
                  width: 40,
                  height: 40,
                  border: '2px solid',
                  borderColor: 'background.paper',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s'
                  }
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    transition: 'transform 0.2s'
                  }
                }}
              >
                {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            )}
          </IconButton>
        </Box>
      </Toolbar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          {user?.photoURL ? (
            <Avatar 
              src={user.photoURL}
              sx={{
                width: 32,
                height: 32,
                mr: 2,
                border: '2px solid',
                borderColor: 'background.paper'
              }}
            />
          ) : (
            <Avatar
              sx={{
                width: 32,
                height: 32,
                mr: 2,
                bgcolor: 'primary.main',
                border: '2px solid',
                borderColor: 'background.paper'
              }}
            >
              {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
            </Avatar>
          )}
          Profile
        </MenuItem>
        <MenuItem onClick={handleDashboardClick}>
          <HomeIcon sx={{ mr: 2 }} />
          Dashboard
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <SettingsIcon sx={{ mr: 2 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchorEl}
        open={Boolean(mobileMenuAnchorEl)}
        onClose={() => setMobileMenuAnchorEl(null)}
        PaperProps={{
          sx: {
            mt: 1,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleProfileClick}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {user?.photoURL ? (
              <Avatar 
                src={user.photoURL}
                sx={{
                  width: 32,
                  height: 32,
                  mr: 2,
                  border: '2px solid',
                  borderColor: 'background.paper'
                }}
              />
            ) : (
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  mr: 2,
                  bgcolor: 'primary.main',
                  border: '2px solid',
                  borderColor: 'background.paper'
                }}
              >
                {user?.displayName?.[0]?.toUpperCase() || <AccountCircle />}
              </Avatar>
            )}
            <Typography>Profile</Typography>
          </Box>
        </MenuItem>
        <MenuItem onClick={handleDashboardClick}>
          <IconButton color="inherit">
            <HomeIcon />
          </IconButton>
          Dashboard
        </MenuItem>
        <MenuItem onClick={handleSettingsClick}>
          <IconButton color="inherit">
            <SettingsIcon />
          </IconButton>
          Settings
        </MenuItem>
        <MenuItem>
          <IconButton color="inherit">
            <Badge badgeContent={4} color="error">
              <Notifications />
            </Badge>
          </IconButton>
          Notifications
        </MenuItem>
        <MenuItem>
          <IconButton color="inherit">
            <Badge badgeContent={3} color="error">
              <Message />
            </Badge>
          </IconButton>
          Messages
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Typography color="error">Logout</Typography>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default Header; 