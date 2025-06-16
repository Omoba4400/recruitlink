import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';
import { updateUserData } from '../../services/user.service';
import { AppThunk, AppDispatch, RootState } from '../../store/store';
import { UserProfile } from '../../types/user';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  emailVerified: boolean;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  emailVerified: false,
  initializing: true,
};

// Async action creator for updating user
export const updateUser = (userData: Partial<User>): AppThunk => 
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const currentUser = getState().auth.user;
    if (!currentUser?.id) return;

    try {
      dispatch(setLoading(true));
      // Update Firebase
      await updateUserData(currentUser.id, userData);
      // Update Redux state
      dispatch(setUser({ ...currentUser, ...userData }));
    } catch (error) {
      console.error('Error updating user:', error);
      dispatch(setError(error instanceof Error ? error.message : 'An error occurred'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  };

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state: AuthState, action: PayloadAction<User | null>) => {
      console.log('authSlice - setUser:', { payload: action.payload });
      if (action.payload) {
        state.user = action.payload;
      } else {
        state.user = null;
      }
      state.error = null;
      console.log('authSlice - setUser - new state:', { 
        user: state.user, 
        loading: state.loading, 
        initializing: state.initializing 
      });
    },
    setProfile: (state: AuthState, action: PayloadAction<UserProfile | null>) => {
      console.log('authSlice - setProfile:', { payload: action.payload });
      state.profile = action.payload;
      state.error = null;
      console.log('authSlice - setProfile - new state:', { 
        profile: state.profile
      });
    },
    setLoading: (state: AuthState, action: PayloadAction<boolean>) => {
      console.log('authSlice - setLoading:', { payload: action.payload });
      state.loading = action.payload;
      if (action.payload) {
        state.error = null;
      }
      console.log('authSlice - setLoading - new state:', { loading: state.loading });
    },
    setError: (state: AuthState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearUser: (state: AuthState) => {
      state.user = null;
      state.profile = null;
      state.error = null;
      state.emailVerified = false;
      state.loading = false;
      state.initializing = false;
    },
    updateEmailVerification: (state: AuthState, action: PayloadAction<boolean>) => {
      state.emailVerified = action.payload;
      if (state.user) {
        state.user.emailVerified = action.payload;
      }
    },
    setInitializing: (state: AuthState, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
      if (!action.payload) {
        state.loading = false;
      }
    },
    updatePhoneVerification: (state: AuthState, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.phoneVerified = action.payload;
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
  updatePhoneVerification,
} = authSlice.actions;

export default authSlice.reducer; 