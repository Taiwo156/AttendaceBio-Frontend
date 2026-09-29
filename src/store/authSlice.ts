import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  companyId: string | null;
  user: { id: string; name: string; role: string } | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  companyId: 'COMP-1234',// Mocked for now until backend is ready 
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ companyId: string; user: any }>) => {
      state.companyId = action.payload.companyId;
      state.user = action.payload.user;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.companyId = null;
      state.user = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;