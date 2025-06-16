export interface PrivacySettings {
  profileVisibility: 'public' | 'connections' | 'private';
  emailVisibility: 'public' | 'connections' | 'private';
  phoneVisibility: 'public' | 'connections' | 'private';
  achievementsVisibility: 'public' | 'connections' | 'private';
  statsVisibility: 'public' | 'connections' | 'private';
  sponsorshipVisibility: 'public' | 'connections' | 'private';
  allowMessages: boolean;
  allowConnections: boolean;
  showOnlineStatus: boolean;
  showLastActive: boolean;
  allowProfileSearch: boolean;
} 