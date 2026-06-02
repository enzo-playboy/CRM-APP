import { configureStore } from '@reduxjs/toolkit'
import projectsReducer from './slices/projectsSlice'
import financialReducer from './slices/financialSlice'

export const store = configureStore({
  reducer: {
    projects: projectsReducer,
    financial: financialReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
