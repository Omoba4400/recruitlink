import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  InputAdornment,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Group as GroupIcon,
} from '@mui/icons-material';
import { Group } from '../../types/group';
import { groupService } from '../../services/groupService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store/store';

interface GroupManagerProps {
  onGroupSelect: (group: Group) => void;
}

const GroupManager: React.FC<GroupManagerProps> = ({ onGroupSelect }) => {
  const theme = useTheme();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    sport: '',
    isPrivate: false,
  });
  const currentUser = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!currentUser) return;
    
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const userGroups = await groupService.getUserGroups(currentUser.uid);
        setGroups(userGroups);
      } catch (error) {
        console.error('Error fetching groups:', error);
      }
      setLoading(false);
    };

    fetchGroups();
  }, [currentUser]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const searchResults = await groupService.searchGroups(searchQuery);
      setGroups(searchResults);
    } catch (error) {
      console.error('Error searching groups:', error);
    }
    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!currentUser || !newGroupData.name || !newGroupData.sport) return;

    try {
      const newGroup = await groupService.createGroup({
        name: newGroupData.name,
        description: newGroupData.description,
        sport: newGroupData.sport,
        creatorId: currentUser.uid,
        members: [currentUser.uid],
        admins: [currentUser.uid],
        isPrivate: newGroupData.isPrivate,
      });
      setGroups([newGroup, ...groups]);
      setCreateDialogOpen(false);
      setNewGroupData({
        name: '',
        description: '',
        sport: '',
        isPrivate: false,
      });
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinGroup = async (group: Group) => {
    if (!currentUser) return;

    try {
      await groupService.joinGroup(group.id, currentUser.uid);
      onGroupSelect(group);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  return (
    <Box>
      {/* Search and Create Group Bar */}
      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create
        </Button>
      </Box>

      {/* Groups List */}
      <List sx={{ overflow: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : (
          groups.map((group) => (
            <ListItem
              key={group.id}
              button
              onClick={() => group.members.includes(currentUser?.uid || '') ? onGroupSelect(group) : handleJoinGroup(group)}
            >
              <ListItemAvatar>
                <Avatar src={group.photoURL}>
                  {group.name[0]?.toUpperCase()}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={group.name}
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" component="span">
                      {group.sport}
                    </Typography>
                    <Chip
                      size="small"
                      label={`${group.members.length} members`}
                      sx={{ height: 20 }}
                    />
                  </Box>
                }
              />
              {!group.members.includes(currentUser?.uid || '') && (
                <Button size="small" variant="outlined">
                  Join
                </Button>
              )}
            </ListItem>
          ))
        )}
      </List>

      {/* Create Group Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={newGroupData.name}
              onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Sport"
              value={newGroupData.sport}
              onChange={(e) => setNewGroupData({ ...newGroupData, sport: e.target.value })}
            />
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={newGroupData.description}
              onChange={(e) => setNewGroupData({ ...newGroupData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroupData.name || !newGroupData.sport}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupManager; 