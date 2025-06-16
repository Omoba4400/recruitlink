import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Button,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Chip,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Block as BlockIcon,
  CheckCircle as VerifyIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { UserProfile, UserType } from '../../types/user';
import { getAllUsers, updateUserRole, deleteUser, verifyUser, blockUser } from '../../services/admin.service';

const userTypes: UserType[] = ['athlete', 'coach', 'college', 'sponsor', 'admin'];

interface EditUserDialogProps {
  open: boolean;
  onClose: () => void;
  user: UserProfile | null;
  onSave: (userId: string, role: UserType) => Promise<void>;
}

const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, onClose, user, onSave }) => {
  const [role, setRole] = useState<UserType>(user?.userType || 'athlete');
  const [loading, setLoading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (user) {
      setRole(user.userType);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await onSave(user.uid, role);
      enqueueSnackbar('User role updated successfully', { variant: 'success' });
      onClose();
    } catch (error) {
      console.error('Error updating user role:', error);
      enqueueSnackbar('Failed to update user role', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit User Role</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={role}
              label="Role"
              onChange={(e) => setRole(e.target.value as UserType)}
            >
              {userTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={loading || role === user?.userType}
        >
          {loading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserType>('all');
  const [editUser, setEditUser] = useState<UserProfile | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setError('Failed to load users. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleUpdateRole = async (userId: string, newRole: UserType) => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers(); // Reload users to get updated data
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteUser(userId);
      setUsers(users.filter(user => user.uid !== userId));
      enqueueSnackbar('User deleted successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error deleting user:', error);
      enqueueSnackbar('Failed to delete user', { variant: 'error' });
    }
  };

  const handleVerifyUser = async (userId: string) => {
    try {
      await verifyUser(userId);
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, verified: true } : user
      ));
      enqueueSnackbar('User verified successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error verifying user:', error);
      enqueueSnackbar('Failed to verify user', { variant: 'error' });
    }
  };

  const handleBlockUser = async (userId: string, isBlocked: boolean) => {
    try {
      await blockUser(userId, isBlocked);
      setUsers(users.map(user => 
        user.uid === userId ? { ...user, blocked: isBlocked } : user
      ));
      enqueueSnackbar(`User ${isBlocked ? 'blocked' : 'unblocked'} successfully`, { variant: 'success' });
    } catch (error) {
      console.error('Error updating user block status:', error);
      enqueueSnackbar('Failed to update user block status', { variant: 'error' });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.userType === roleFilter;
    return matchesSearch && matchesRole;
  });

  const displayedUsers = filteredUsers
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        User Management
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            label="Search Users"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 200 }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: 'action.active', mr: 1 }} />,
            }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Role Filter</InputLabel>
            <Select
              value={roleFilter}
              label="Role Filter"
              onChange={(e) => setRoleFilter(e.target.value as 'all' | UserType)}
            >
              <MenuItem value="all">All Roles</MenuItem>
              {userTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayedUsers.map((user) => (
              <TableRow key={user.uid}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar 
                      src={user.photoURL} 
                      alt={user.displayName}
                      sx={{ mr: 2 }}
                    >
                      {user.displayName[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {user.displayName}
                      </Typography>
                      {user.verified && (
                        <Chip 
                          size="small" 
                          label="Verified" 
                          color="primary" 
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Chip 
                    label={user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}
                    color={user.userType === 'admin' ? 'error' : 'default'}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={user.blocked ? 'Blocked' : 'Active'}
                    color={user.blocked ? 'error' : 'success'}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Edit Role">
                      <IconButton 
                        size="small"
                        onClick={() => setEditUser(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    {!user.verified && (
                      <Tooltip title="Verify User">
                        <IconButton 
                          size="small"
                          onClick={() => handleVerifyUser(user.uid)}
                        >
                          <VerifyIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title={user.blocked ? "Unblock User" : "Block User"}>
                      <IconButton 
                        size="small"
                        onClick={() => handleBlockUser(user.uid, !user.blocked)}
                      >
                        <BlockIcon color={user.blocked ? "error" : "inherit"} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete User">
                      <IconButton 
                        size="small"
                        onClick={() => handleDeleteUser(user.uid)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredUsers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Edit User Dialog */}
      <EditUserDialog
        open={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onSave={handleUpdateRole}
      />
    </Box>
  );
};

export default Users; 