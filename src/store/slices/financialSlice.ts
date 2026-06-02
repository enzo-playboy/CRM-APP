import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { supabase } from '@/lib/supabase'
import type { Expense, Revenue, RevenueManual, FinancialSummary, PeriodFilter } from '@/types'

interface FinancialState {
  expenses: Expense[]
  revenues: Revenue[]
  manualRevenues: RevenueManual[]
  summary: FinancialSummary
  period: PeriodFilter
  isLoading: boolean
  error: string | null
}

const getDefaultPeriod = (): PeriodFilter => {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    startDate: firstDay.toISOString().split('T')[0],
    endDate: lastDay.toISOString().split('T')[0],
  }
}

const initialState: FinancialState = {
  expenses: [],
  revenues: [],
  manualRevenues: [],
  summary: {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueByMonth: [],
    expensesByMonth: [],
    expensesByCategory: [],
  },
  period: getDefaultPeriod(),
  isLoading: false,
  error: null,
}

// Async thunks
export const fetchExpenses = createAsyncThunk(
  'financial/fetchExpenses',
  async (period: PeriodFilter) => {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', period.startDate)
      .lte('date', period.endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  }
)

export const createExpense = createAsyncThunk(
  'financial/createExpense',
  async (expense: Omit<Expense, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert(expense)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const deleteExpense = createAsyncThunk(
  'financial/deleteExpense',
  async (id: string) => {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

export const updateExpense = createAsyncThunk(
  'financial/updateExpense',
  async ({ id, data }: { id: string; data: Partial<Expense> }) => {
    const { error } = await supabase
      .from('expenses')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return { id, data }
  }
)

export const fetchRevenues = createAsyncThunk(
  'financial/fetchRevenues',
  async (period: PeriodFilter) => {
    const response = await fetch(
      `/api/stripe/payments?startDate=${period.startDate}&endDate=${period.endDate}`
    )
    if (!response.ok) throw new Error('Erro ao buscar receitas')
    return await response.json()
  }
)

// ==========================================
// RECEITAS MANUAIS
// ==========================================

export const fetchManualRevenues = createAsyncThunk(
  'financial/fetchManualRevenues',
  async (period: PeriodFilter) => {
    const { data, error } = await supabase
      .from('revenue_manual')
      .select('*')
      .gte('date', period.startDate)
      .lte('date', period.endDate)
      .order('date', { ascending: false })

    if (error) throw error
    return data || []
  }
)

export const createManualRevenue = createAsyncThunk(
  'financial/createManualRevenue',
  async (revenue: Omit<RevenueManual, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('revenue_manual')
      .insert(revenue)
      .select()
      .single()

    if (error) throw error
    return data
  }
)

export const updateManualRevenue = createAsyncThunk(
  'financial/updateManualRevenue',
  async ({ id, data }: { id: string; data: Partial<RevenueManual> }) => {
    const { error } = await supabase
      .from('revenue_manual')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
    return { id, data }
  }
)

export const deleteManualRevenue = createAsyncThunk(
  'financial/deleteManualRevenue',
  async (id: string) => {
    const { error } = await supabase
      .from('revenue_manual')
      .delete()
      .eq('id', id)

    if (error) throw error
    return id
  }
)

const calculateSummary = (expenses: Expense[], revenues: Revenue[], manualRevenues: RevenueManual[] = []): FinancialSummary => {
  const stripeRevenue = revenues.reduce((sum, r) => sum + r.amount, 0)
  const manualRevenue = manualRevenues.reduce((sum, r) => sum + r.amount, 0)
  const totalRevenue = stripeRevenue + manualRevenue
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  // Group by month
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  
  const revenueByMonth = monthNames.map((month, index) => ({
    month,
    amount: revenues
      .filter(r => new Date(r.created_at).getMonth() === index)
      .reduce((sum, r) => sum + r.amount, 0) +
      manualRevenues
      .filter(r => new Date(r.date).getMonth() === index)
      .reduce((sum, r) => sum + r.amount, 0),
  }))

  const expensesByMonth = monthNames.map((month, index) => ({
    month,
    amount: expenses
      .filter(e => new Date(e.date).getMonth() === index)
      .reduce((sum, e) => sum + e.amount, 0),
  }))

  // Expenses by category
  const expensesByCategory = [
    { category: 'Fixa', amount: expenses.filter(e => e.category === 'fixa').reduce((sum, e) => sum + e.amount, 0) },
    { category: 'Variável', amount: expenses.filter(e => e.category === 'variavel').reduce((sum, e) => sum + e.amount, 0) },
    { category: 'Projeto', amount: expenses.filter(e => e.category === 'projeto').reduce((sum, e) => sum + e.amount, 0) },
  ]

  return {
    totalRevenue,
    totalExpenses,
    netProfit,
    revenueByMonth,
    expensesByMonth,
    expensesByCategory,
  }
}

const financialSlice = createSlice({
  name: 'financial',
  initialState,
  reducers: {
    setPeriod: (state, action: PayloadAction<PeriodFilter>) => {
      state.period = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch expenses
      .addCase(fetchExpenses.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchExpenses.fulfilled, (state, action) => {
        state.isLoading = false
        state.expenses = action.payload
        state.summary = calculateSummary(action.payload, state.revenues, state.manualRevenues)
      })
      .addCase(fetchExpenses.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao buscar despesas'
      })
      // Create expense
      .addCase(createExpense.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createExpense.fulfilled, (state, action) => {
        state.isLoading = false
        state.expenses.unshift(action.payload)
        state.summary = calculateSummary(state.expenses, state.revenues, state.manualRevenues)
      })
      .addCase(createExpense.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao criar despesa'
      })
      // Delete expense
      .addCase(deleteExpense.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteExpense.fulfilled, (state, action) => {
        state.isLoading = false
        state.expenses = state.expenses.filter(e => e.id !== action.payload)
        state.summary = calculateSummary(state.expenses, state.revenues, state.manualRevenues)
      })
      .addCase(deleteExpense.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao excluir despesa'
      })
      // Update expense
      .addCase(updateExpense.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateExpense.fulfilled, (state, action) => {
        state.isLoading = false
        state.expenses = state.expenses.map(e => 
          e.id === action.payload.id ? { ...e, ...action.payload.data } : e
        )
        state.summary = calculateSummary(state.expenses, state.revenues, state.manualRevenues)
      })
      .addCase(updateExpense.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao atualizar despesa'
      })
      // Fetch revenues
      .addCase(fetchRevenues.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchRevenues.fulfilled, (state, action) => {
        state.isLoading = false
        state.revenues = action.payload
        state.summary = calculateSummary(state.expenses, action.payload, state.manualRevenues)
      })
      .addCase(fetchRevenues.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao buscar receitas'
      })
      // ==========================================
      // RECEITAS MANUAIS
      // ==========================================
      // Fetch manual revenues
      .addCase(fetchManualRevenues.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(fetchManualRevenues.fulfilled, (state, action) => {
        state.isLoading = false
        state.manualRevenues = action.payload
        state.summary = calculateSummary(state.expenses, state.revenues, action.payload)
      })
      .addCase(fetchManualRevenues.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao buscar receitas manuais'
      })
      // Create manual revenue
      .addCase(createManualRevenue.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(createManualRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.manualRevenues.unshift(action.payload)
        state.summary = calculateSummary(state.expenses, state.revenues, state.manualRevenues)
      })
      .addCase(createManualRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao criar receita manual'
      })
      // Update manual revenue
      .addCase(updateManualRevenue.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(updateManualRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.manualRevenues = state.manualRevenues.map(r => 
          r.id === action.payload.id ? { ...r, ...action.payload.data } : r
        )
        state.summary = calculateSummary(state.expenses, state.revenues, state.manualRevenues)
      })
      .addCase(updateManualRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao atualizar receita manual'
      })
      // Delete manual revenue
      .addCase(deleteManualRevenue.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(deleteManualRevenue.fulfilled, (state, action) => {
        state.isLoading = false
        state.manualRevenues = state.manualRevenues.filter(r => r.id !== action.payload)
        state.summary = calculateSummary(state.expenses, state.revenues, state.manualRevenues)
      })
      .addCase(deleteManualRevenue.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Erro ao excluir receita manual'
      })
  },
})

export const { setPeriod, clearError } = financialSlice.actions
export default financialSlice.reducer
