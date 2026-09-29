import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { fetchEmployees } from '../api/employee';
import type { Employee } from '../types/employee';
import type { RootState } from './index';

export interface EmployeeState {
  list: Employee[];
  loading: boolean;
  error: string | null;
  filters: {
    search: string;
    division: string;
    department: string;
    status: string;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: EmployeeState = {
  list: [],
  loading: false,
  error: null,
  filters: { search: '', division: 'All', department: 'All', status: 'All' },
  pagination: { page: 1, limit: 10, total: 0 },
};

export const getEmployees = createAsyncThunk(
  'employees/getEmployees',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { companyId } = state.auth;
      const { search, division, department, status } = state.employees.filters;
      const { page, limit } = state.employees.pagination;

      if (!companyId) throw new Error('No company ID found');

      const response = await fetchEmployees({
        companyId,
        search,
        division,
        department,
        status,
        page,
        limit,
      });
      return response;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch employees');
    }
  }
);

const employeeSlice = createSlice({
  name: 'employees',
  initialState,
  reducers: {
    setFilter: (
      state,
      action: PayloadAction<{ key: keyof EmployeeState['filters']; value: string }>
    ) => {
      state.filters[action.payload.key] = action.payload.value;
      state.pagination.page = 1;
    },
    setPage: (state, action: PayloadAction<number>) => {
      state.pagination.page = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(getEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination.total = action.payload.total;
      })
      .addCase(getEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setFilter, setPage } = employeeSlice.actions;
export default employeeSlice.reducer;