import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

// Custom function to invoke Edge Functions
export const invokeFunctionWithRetry = async (functionName: string, body: any, retries = 3) => {
  let attempt = 0;
  
  while (attempt < retries) {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body,
        headers: {
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json"
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error: any) {
      attempt++;
      console.error(`Function invocation error (attempt ${attempt}/${retries}):`, error);
      
      if (attempt === retries) {
        return { data: null, error };
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  return { data: null, error: new Error('Max retries exceeded') };
};

// Types for messages
export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
  conversation_id: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  last_message?: string;
  last_message_time?: string;
  created_at: string;
  updated_at: string;
}

// Real-time subscription helpers
export const subscribeToMessages = (
  conversationId: string,
  callback: (message: Message) => void
) => {
  return supabase
    .channel(`messages:${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => callback(payload.new as Message)
    )
    .subscribe();
};

export const subscribeToUserPresence = (
  userId: string,
  callback: (online: boolean) => void
) => {
  return supabase
    .channel(`presence:${userId}`)
    .on('presence', { event: 'sync' }, () => {
      const presenceState = supabase.channel(`presence:${userId}`).presenceState();
      callback(Object.keys(presenceState).length > 0);
    })
    .subscribe();
}; 