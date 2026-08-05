import { configureStore } from "@reduxjs/toolkit"
import categorySlice from "./categorySlice"
import expenseSlice from "./expenseSlice"
import authReducer from "./authSlice"

export const store = configureStore({
  reducer: {
    categories: categorySlice,
    expenses:   expenseSlice,
    auth:       authReducer,
  }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch