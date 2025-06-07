import { supabase } from '../config/supabase';

class PresenceService {
  async updatePresence(userId: string, online: boolean) {
    if (online) {
      await supabase.channel(`presence:${userId}`).track({
        user_id: userId,
        online_at: new Date().toISOString()
      });
    }
  }

  subscribeToUserPresence(userId: string, callback: (online: boolean) => void) {
    return supabase
      .channel(`presence:${userId}`)
      .on('presence', { event: 'sync' }, () => {
        const presenceState = supabase.channel(`presence:${userId}`).presenceState();
        callback(Object.keys(presenceState).length > 0);
      })
      .subscribe();
  }
}

export const presenceService = new PresenceService(); 