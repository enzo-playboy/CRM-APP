import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase'
import { parseProject, type Project, type CalculatorData } from '@/types'

interface ProjectsState {
  projects: Project[]
  currentProject: Project | null
  calculatorData: CalculatorData
  isLoading: boolean
  error: string | null
}

const initialState: ProjectsState = {
  projects: [],
  currentProject: null,
  calculatorData: {
    serviceType: 'landing_page',
    pages: 5,
    deadline: 'normal',
    features: [],
  },
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return (data || []).map(parseProject)
  }
)

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (project: Omit<Project, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single()

    if (error) throw error
    return parseProject(data)
  }
)

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, ...updates }: Partial<Project> & { id: string }) => {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return parseProject(data)
  }
)


export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: string) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setCalculatorData: (state, action: PayloadAction<Partial<CalculatorData>>) => {
      state.calculatorData = { ...state.calculatorData, ...action.payload }
    },
    resetCalculatorData: (state) => {
      state.calculatorData = initialState.calculatorData
    },
    setCurrentProject: (state, action: PayloadAction<Project | null>) => {
      state.currentProject = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.isLoading = false
        state.projects = action.payload
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao buscar projetos'
      })
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false
        state.projects.unshift(action.payload)
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao criar projeto'
      })
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false
        const index = state.projects.findIndex(p => p.id === action.payload.id)
        if (index !== -1) {
          state.projects[index] = action.payload
        }
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao atualizar projeto'
      })
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false
        state.projects = state.projects.filter(p => p.id !== action.payload)
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao excluir projeto'
      })
  },
})

export const { 
  setCalculatorData, 
  resetCalculatorData, 
  setCurrentProject, 
  clearError 
} = projectsSlice.actions

export default projectsSlice.reducer
