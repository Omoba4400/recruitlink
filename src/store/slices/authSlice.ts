import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';
import { User, UserProfile } from '../../types/user';
import { updateUserData } from '../../services/user.service';
import { AppThunk, AppDispatch, RootState } from '../../store/store';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  emailVerified: boolean;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: true,
  error: null,
  isAuthenticated: false,
  emailVerified: false,
  initializing: true,
};

// Async action creator for updating user
export const updateUser = (userData: Partial<User>): AppThunk => 
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const currentUser = getState().auth.user;
    if (!currentUser?.id) return;

    try {
      // Update Firebase
      await updateUserData(currentUser.id, userData);
      // Update Redux state
      dispatch(setUser({ ...currentUser, ...userData }));
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      if (action.payload) {
        state.user = action.payload;
        state.isAuthenticated = true;
      } else {
        state.user = null;
        state.profile = null;
        state.isAuthenticated = false;
      }
      state.error = null;
      state.loading = false;
      state.initializing = false;
    },
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      if (state.user) {
        // Ensure we preserve the User-specific fields while updating shared fields
        state.user = {
          ...state.user,
          ...action.payload,
          photoURL: action.payload.photoURL || state.user.photoURL,
          id: state.user.id, // Preserve the id field from User type
          emailVerified: state.user.emailVerified, // Preserve emailVerified status
          isAdmin: state.user.isAdmin, // Preserve admin status
          followers: state.user.followers,
          following: state.user.following,
          connections: state.user.connections,
        };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearUser: (state) => {
      state.user = null;
      state.profile = null;
      state.isAuthenticated = false;
      state.error = null;
      state.emailVerified = false;
      state.loading = false;
      state.initializing = false;
    },
    updateEmailVerification: (state, action: PayloadAction<boolean>) => {
      state.emailVerified = action.payload;
      if (state.user) {
        state.user.emailVerified = action.payload;
      }
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
      if (!action.payload) {
        state.loading = false;
      }
    },
  },
});

export const {
  setUser,
  setProfile,
  setLoading,
  setError,
  clearUser,
  updateEmailVerification,
  setInitializing,
} = authSlice.actions;

export default authSlice.reducer; 