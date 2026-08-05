import { createSlice } from '@reduxjs/toolkit'
import type { Expense } from '../types'

interface ExpenseState {
  list: Expense[]
  loading: boolean
  error: string | null
  pendingIds: string[]  // temp IDs being confirmed with server
}

const initialState: ExpenseState = {
  list: [],
  loading: false,
  error: null,
  pendingIds: [],
}

export const expenseSlice = createSlice({
  name: 'expenses',
  initialState,
  reducers: {
    setExpenses: (state, action) => {
      state.list = action.payload
    },
    // Optimistic add — immediately shows in UI with temp ID
    addPendingExpense: (state, action) => {
      state.list.unshift(action.payload)  // add to front (newest first)
      state.pendingIds.push(action.payload.id)
    },
    // Server confirmed — replace temp expense with real one
    confirmExpense: (state, action) => {
      const { tempId, expense } = action.payload
      state.list = state.list
        .filter(e => e.id !== tempId)
        .concat(expense)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      state.pendingIds = state.pendingIds.filter(id => id !== tempId)
    },
    // Server failed — remove optimistic expense
    rejectExpense: (state, action) => {
      state.list = state.list.filter(e => e.id !== action.payload)
      state.pendingIds = state.pendingIds.filter(id => id !== action.payload)
    },
    // Keep old addExpense for compatibility
    addExpense: (state, action) => {
      state.list.unshift(action.payload)
    },
    deleteExpense: (state, action) => {
      state.list = state.list.filter(e => e.id !== action.payload)
    },
    setExpenseLoading: (state, action) => {
      state.loading = action.payload
    },
    setExpenseError: (state, action) => {
      state.error = action.payload
    },
  },
})

export const {
  setExpenses,
  addPendingExpense,
  confirmExpense,
  rejectExpense,
  addExpense,
  deleteExpense,
  setExpenseLoading,
  setExpenseError,
} = expenseSlice.actions

export default expenseSlice.reducer