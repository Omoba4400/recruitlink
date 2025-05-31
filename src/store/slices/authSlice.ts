import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types/user';

interface AuthState {
  user: User | null;
  error: string | null;
  emailVerified: boolean;
  initializing: boolean;
}

const initialState: AuthState = {
  user: null,
  error: null,
  emailVerified: false,
  initializing: true,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.emailVerified = action.payload.emailVerified || false;
      state.error = null;
      state.initializing = false;
    },
    clearUser: (state) => {
      state.user = null;
      state.error = null;
      state.emailVerified = false;
      state.initializing = false;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.initializing = false;
    },
    updateEmailVerification: (state, action: PayloadAction<boolean>) => {
      if (state.user) {
        state.user.emailVerified = action.payload;
      }
      state.emailVerified = action.payload;
    },
    setInitializing: (state, action: PayloadAction<boolean>) => {
      state.initializing = action.payload;
    },
  },
});

export const {
  setUser,
  clearUser,
  setError,
  updateEmailVerification,
  setInitializing
} = authSlice.actions;

export default authSlice.reducer; 