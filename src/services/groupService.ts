import { supabase } from '../config/supabase';
import { Group, GroupMessage, GroupInvite, JoinRequest } from '../types/group';
import { User } from '../types/user';

class GroupService {
  // Create a new group
  async createGroup(group: Omit<Group, 'id' | 'createdAt' | 'updatedAt'>): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .insert({
        ...group,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get group by ID
  async getGroup(groupId: string): Promise<Group> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (error) throw error;
    return data;
  }

  // Get groups by sport
  async getGroupsBySport(sport: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('sport', sport)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Get user's groups
  async getUserGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .contains('members', [userId])
      .order('updatedAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Join group
  async joinGroup(groupId: string, userId: string): Promise<void> {
    const { data: group } = await supabase
      .from('groups')
      .select('members')
      .eq('id', groupId)
      .single();

    if (!group) throw new Error('Group not found');

    const updatedMembers = [...group.members, userId];
    const { error } = await supabase
      .from('groups')
      .update({ members: updatedMembers, updatedAt: new Date().toISOString() })
      .eq('id', groupId);

    if (error) throw error;
  }

  // Leave group
  async leaveGroup(groupId: string, userId: string): Promise<void> {
    const { data: group } = await supabase
      .from('groups')
      .select('members')
      .eq('id', groupId)
      .single();

    if (!group) throw new Error('Group not found');

    const updatedMembers = group.members.filter((id: string) => id !== userId);
    const { error } = await supabase
      .from('groups')
      .update({ members: updatedMembers, updatedAt: new Date().toISOString() })
      .eq('id', groupId);

    if (error) throw error;
  }

  // Send group message
  async sendGroupMessage(groupId: string, senderId: string, content: string): Promise<GroupMessage> {
    const { data, error } = await supabase
      .from('group_messages')
      .insert({
        groupId,
        senderId,
        content,
        timestamp: new Date().toISOString(),
        type: 'text'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Get group messages
  async getGroupMessages(groupId: string): Promise<GroupMessage[]> {
    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('groupId', groupId)
      .order('timestamp', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  // Subscribe to group messages
  subscribeToGroupMessages(groupId: string, callback: (messages: GroupMessage[]) => void) {
    const channel = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_messages',
          filter: `groupId=eq.${groupId}`,
        },
        async () => {
          const { data } = await supabase
            .from('group_messages')
            .select('*')
            .eq('groupId', groupId)
            .order('timestamp', { ascending: true });
          callback(data || []);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  // Search groups
  async searchGroups(query: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .or(`name.ilike.%${query}%, description.ilike.%${query}%, sport.ilike.%${query}%`)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const groupService = new GroupService(); 