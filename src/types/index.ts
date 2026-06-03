export interface Lead {
  id: string
  name?: string
  email?: string
  phone?: string
  company?: string
  nicho?: string
  instagram?: string
  estado?: 'lead' | 'client' | 'inactive'
  temperatura?: 'quente' | 'morno' | 'frio'
  historico_pagamento?: string
  created_at: string
  updated_at?: string
  user_id?: string
  metadata?: any
  notes?: string
  tags?: string[]
}

export interface Conversa {
  id: string
  lead_id: string
  content: string
  direction: 'inbound' | 'outbound'
  channel: 'whatsapp' | 'email' | 'chat' | 'n8n'
  n8n_execution_id?: string
  created_at: string
  user_id?: string
}

export interface User {
  id: string
  email?: string
  name?: string
  role?: 'admin' | 'manager' | 'agent'
  avatar_url?: string
}

export type ServiceType = 'landing_page' | 'site' | 'app' | 'sistema' | 'consultoria' | 'agentes_ia'

export type Deadline = 'urgente' | 'normal' | 'flexivel'

export type Feature = 
  | 'forms' 
  | 'login' 
  | 'pagamento' 
  | 'dashboard' 
  | 'api' 
  | 'analytics' 
  | 'notificacoes' 
  | 'chat'
  | 'multiusuario'
  | 'seo'

export interface Project {
  id: string
  name: string
  description?: string
  lead_id?: string
  service_type: ServiceType
  pages: number
  deadline: Deadline
  features: Feature[]
  calculated_value: number
  status: 'calculating' | 'proposed' | 'approved' | 'rejected'
  notes?: string
  created_at: string
  updated_at?: string
  user_id?: string
}

export interface CalculatorData {
  serviceType: ServiceType
  pages: number
  deadline: Deadline
  features: Feature[]
}

export const SERVICE_TYPES: Record<ServiceType, { label: string; baseValue: number }> = {
  landing_page: { label: 'Landing Page', baseValue: 2000 },
  site: { label: 'Site', baseValue: 5000 },
  app: { label: 'App', baseValue: 15000 },
  sistema: { label: 'Sistema', baseValue: 25000 },
  consultoria: { label: 'Consultoria', baseValue: 500 },
  agentes_ia: { label: 'Agentes de IA', baseValue: 1350 },
}

export const DEADLINE_OPTIONS: Record<Deadline, { label: string; multiplier: number }> = {
  urgente: { label: 'Urgente (1 semana)', multiplier: 1.5 },
  normal: { label: 'Normal (2-4 semanas)', multiplier: 1.0 },
  flexivel: { label: 'Flexível (1-2 meses)', multiplier: 0.8 },
}

export const FEATURE_OPTIONS: Record<Feature, { label: string; value: number }> = {
  forms: { label: 'Formulários', value: 1000 },
  login: { label: 'Sistema de Login', value: 1000 },
  pagamento: { label: 'Pagamento', value: 1000 },
  dashboard: { label: 'Dashboard', value: 1000 },
  api: { label: 'Integração API', value: 1000 },
  analytics: { label: 'Analytics', value: 1000 },
  notificacoes: { label: 'Notificações', value: 1000 },
  chat: { label: 'Chat', value: 1000 },
  multiusuario: { label: 'Multi-usuário', value: 1000 },
  seo: { label: 'SEO', value: 1000 },
}

// ==========================================
// TIPOS FINANCEIROS
// ==========================================

export type ExpenseCategory = 'fixa' | 'variavel' | 'projeto'

export interface Expense {
  id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  project_id?: string
  recurring: boolean
  created_at: string
  user_id?: string
  lead_id?: string
}

export interface Revenue {
  id: string
  stripe_payment_id?: string
  stripe_invoice_id?: string
  customer_email?: string
  customer_name?: string
  amount: number
  currency: string
  status: 'succeeded' | 'pending' | 'failed' | 'refunded'
  type: 'payment' | 'invoice' | 'subscription'
  description?: string
  created_at: string
}

export interface FinancialSummary {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  revenueByMonth: { month: string; amount: number }[]
  expensesByMonth: { month: string; amount: number }[]
  expensesByCategory: { category: string; amount: number }[]
}

export interface PeriodFilter {
  startDate: string
  endDate: string
}

export const EXPENSE_CATEGORIES: Record<ExpenseCategory, { label: string; color: string }> = {
  fixa: { label: 'Fixa', color: 'red' },
  variavel: { label: 'Variável', color: 'yellow' },
  projeto: { label: 'Por Projeto', color: 'blue' },
}

// ==========================================
// RECEITA MANUAL
// ==========================================

export type RevenueCategory = 'projeto' | 'servico' | 'consultoria' | 'recorrente' | 'outros'

export type PaymentMethod = 'pix' | 'cartao' | 'boleto' | 'transferencia' | 'dinheiro'

export type RevenueStatus = 'pending' | 'received' | 'cancelled'

export interface RevenueManual {
  id: string
  description: string
  amount: number
  customer_name?: string
  customer_email?: string
  category: RevenueCategory
  payment_method: PaymentMethod
  status: RevenueStatus
  date: string
  notes?: string
  created_at: string
  updated_at?: string
  user_id?: string
}

export const REVENUE_CATEGORIES: Record<RevenueCategory, { label: string; color: string }> = {
  projeto: { label: 'Projeto', color: 'blue' },
  servico: { label: 'Serviço', color: 'purple' },
  consultoria: { label: 'Consultoria', color: 'green' },
  recorrente: { label: 'Recorrente', color: 'amber' },
  outros: { label: 'Outros', color: 'gray' },
}

export const PAYMENT_METHODS: Record<PaymentMethod, { label: string; icon: string }> = {
  pix: { label: 'PIX', icon: '⚡' },
  cartao: { label: 'Cartão', icon: '💳' },
  boleto: { label: 'Boleto', icon: '📄' },
  transferencia: { label: 'Transferência', icon: '🏦' },
  dinheiro: { label: 'Dinheiro', icon: '💵' },
}

export const REVENUE_STATUS: Record<RevenueStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'yellow' },
  received: { label: 'Recebido', color: 'green' },
  cancelled: { label: 'Cancelado', color: 'red' },
}

// ==========================================
// TIPOS DE METAS
// ==========================================

export interface Goal {
  id: string
  user_id: string
  month: number
  year: number
  monthly_leads_goal: number
  daily_leads_goal: number
  revenue_goal: number
  projects_goal: number
  response_time_goal: number
  created_at: string
  updated_at: string
}

export interface ProspectionMetrics {
  totalPipeline: number
  conversionRate: number
  pipelineValue: number
  goalProgress: number
  pipelineByStage: {
    stage: string
    count: number
    value: number
    percentage: number
  }[]
  monthlyEvolution: {
    month: string
    newLeads: number
    conversions: number
  }[]
}
