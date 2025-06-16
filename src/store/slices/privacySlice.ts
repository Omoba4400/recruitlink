import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

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

interface PrivacyState {
  settings: PrivacySettings;
  loading: boolean;
  error: string | null;
  saveStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
}

const initialState: PrivacyState = {
  settings: {
    profileVisibility: 'public',
    emailVisibility: 'connections',
    phoneVisibility: 'private',
    achievementsVisibility: 'public',
    statsVisibility: 'connections',
    sponsorshipVisibility: 'public',
    allowMessages: true,
    allowConnections: true,
    showOnlineStatus: true,
    showLastActive: true,
    allowProfileSearch: true,
  },
  loading: false,
  error: null,
  saveStatus: 'idle',
};

// Async thunk for fetching privacy settings
export const fetchPrivacySettings = createAsyncThunk(
  'privacy/fetchSettings',
  async (userId: string) => {
    const docRef = doc(db, 'users', userId, 'settings', 'privacy');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PrivacySettings;
    }
    return initialState.settings;
  }
);

// Async thunk for saving privacy settings
export const savePrivacySettings = createAsyncThunk(
  'privacy/saveSettings',
  async ({ userId, settings }: { userId: string; settings: PrivacySettings }) => {
    const docRef = doc(db, 'users', userId, 'settings', 'privacy');
    await setDoc(docRef, settings, { merge: true });
    return settings;
  }
);

const privacySlice = createSlice({
  name: 'privacy',
  initialState,
  reducers: {
    updateSettings: (state, action: PayloadAction<Partial<PrivacySettings>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    resetSaveStatus: (state) => {
      state.saveStatus = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch privacy settings
      .addCase(fetchPrivacySettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrivacySettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
      })
      .addCase(fetchPrivacySettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch privacy settings';
      })
      // Save privacy settings
      .addCase(savePrivacySettings.pending, (state) => {
        state.saveStatus = 'loading';
        state.error = null;
      })
      .addCase(savePrivacySettings.fulfilled, (state, action) => {
        state.saveStatus = 'succeeded';
        state.settings = action.payload;
      })
      .addCase(savePrivacySettings.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.error = action.error.message || 'Failed to save privacy settings';
      });
  },
});

export const { updateSettings, resetSaveStatus } = privacySlice.actions;
export default privacySlice.reducer; 