'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { 
  Target, 
  Users, 
  DollarSign, 
  FolderOpen, 
  Clock, 
  Save,
  TrendingUp,
  CheckCircle
} from 'lucide-react'

interface GoalData {
  monthly_leads_goal: number
  daily_leads_goal: number
  revenue_goal: number
  projects_goal: number
  response_time_goal: number
}

interface CurrentStats {
  totalLeads: number
  todayLeads: number
  totalRevenue: number
  totalProjects: number
  avgResponseTime: number
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalData>({
    monthly_leads_goal: 100,
    daily_leads_goal: 5,
    revenue_goal: 50000,
    projects_goal: 10,
    response_time_goal: 2,
  })
  const [stats, setStats] = useState<CurrentStats>({
    totalLeads: 0,
    todayLeads: 0,
    totalRevenue: 0,
    totalProjects: 0,
    avgResponseTime: 1.5,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    fetchGoals()
    fetchStats()
  }, [])

  const fetchGoals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .single()

      if (data) {
        setGoals({
          monthly_leads_goal: data.monthly_leads_goal || 0,
          daily_leads_goal: data.daily_leads_goal || 0,
          revenue_goal: data.revenue_goal || 0,
          projects_goal: data.projects_goal || 0,
          response_time_goal: data.response_time_goal || 0,
        })
      }
    } catch (error) {
      console.error('Erro ao buscar metas:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const { data: leadsData } = await supabase
        .from('leads')
        .select('*')

      const totalLeads = leadsData?.length || 0
      const today = new Date().toLocaleDateString('en-CA')
      const todayLeads = (leadsData || []).filter((l: any) => {
        if (!l.created_at) return false
        const leadDate = new Date(l.created_at).toLocaleDateString('en-CA')
        return leadDate === today
      }).length

      const { count: totalProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })

      let totalRevenue = 0
      try {
        const startOfMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0]
        const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0]
        const { data: revenueData, error: revError } = await supabase
          .from('revenues_manual')
          .select('amount')
          .eq('status', 'received')
          .gte('date', startOfMonth)
          .lte('date', endOfMonth)
        if (!revError && revenueData) {
          totalRevenue = revenueData.reduce((sum, r) => sum + (r.amount || 0), 0)
        } else {
          totalRevenue = 0
        }
      } catch (err) {
        totalRevenue = 0
      }

      setStats({
        totalLeads: totalLeads,
        todayLeads: todayLeads,
        totalRevenue: totalRevenue,
        totalProjects: totalProjects || 0,
        avgResponseTime: 1.5,
      })
    } catch (error) {
      console.error('Erro ao buscar stats:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('goals')
        .upsert({
          user_id: user.id,
          month: currentMonth,
          year: currentYear,
          monthly_leads_goal: goals.monthly_leads_goal,
          daily_leads_goal: goals.daily_leads_goal,
          revenue_goal: goals.revenue_goal,
          projects_goal: goals.projects_goal,
          response_time_goal: goals.response_time_goal,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,month,year',
        })

      if (error) throw error
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar metas:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-emerald-500 to-green-400'
    if (percentage >= 50) return 'from-primary-500 to-primary-400'
    if (percentage >= 25) return 'from-amber-500 to-yellow-400'
    return 'from-red-500 to-orange-400'
  }

  const getProgressBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-emerald-100'
    if (percentage >= 50) return 'bg-primary-100'
    if (percentage >= 25) return 'bg-amber-100'
    return 'bg-red-100'
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
      </div>
    )
  }

  const goalsConfig = [
    {
      title: 'Leads por Mês',
      icon: Users,
      value: goals.monthly_leads_goal,
      current: stats.totalLeads,
      field: 'monthly_leads_goal' as keyof GoalData,
      suffix: 'leads',
      color: 'from-primary-500 to-primary-400',
    },
    {
      title: 'Leads por Dia',
      icon: Users,
      value: goals.daily_leads_goal,
      current: stats.todayLeads,
      field: 'daily_leads_goal' as keyof GoalData,
      suffix: 'leads',
      color: 'from-indigo-500 to-indigo-400',
    },
    {
      title: 'Meta de Faturamento',
      icon: DollarSign,
      value: goals.revenue_goal,
      current: stats.totalRevenue,
      field: 'revenue_goal' as keyof GoalData,
      suffix: '',
      isCurrency: true,
      color: 'from-emerald-500 to-green-400',
    },
    {
      title: 'Meta de Projetos',
      icon: FolderOpen,
      value: goals.projects_goal,
      current: stats.totalProjects,
      field: 'projects_goal' as keyof GoalData,
      suffix: 'projetos',
      color: 'from-amber-500 to-yellow-400',
    },
    {
      title: 'Tempo de Resposta',
      icon: Clock,
      value: goals.response_time_goal,
      current: stats.avgResponseTime,
      field: 'response_time_goal' as keyof GoalData,
      suffix: 'horas',
      invertProgress: true,
      color: 'from-purple-500 to-violet-400',
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Definir Metas</h1>
          <p className="text-text-muted mt-1">Configure suas metas mensais de prospecção.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500 text-white font-semibold px-6 py-3 rounded-2xl shadow-glow hover:shadow-glass-lg transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {saved ? (
            <>
              <CheckCircle className="w-5 h-5" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              {isSaving ? 'Salvando...' : 'Salvar Metas'}
            </>
          )}
        </button>
      </div>

      <div className="glass rounded-3xl p-6 shadow-glass">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold text-text-primary">
            Metas - {new Date(currentYear, currentMonth - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goalsConfig.map((config) => {
            const Icon = config.icon
            const percentage = config.invertProgress
              ? Math.min(100, (config.value > 0 ? (config.value / Math.max(config.current, config.value)) * 100 : 0))
              : Math.min(100, (config.current / config.value) * 100)
            const progressColor = config.invertProgress
              ? (percentage >= 80 ? 'from-emerald-500 to-green-400' : percentage >= 50 ? 'from-primary-500 to-primary-400' : 'from-red-500 to-orange-400')
              : getProgressColor(percentage)
            const progressBg = config.invertProgress
              ? (percentage >= 80 ? 'bg-emerald-100' : percentage >= 50 ? 'bg-primary-100' : 'bg-red-100')
              : getProgressBg(percentage)

            return (
              <div key={config.field} className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${config.color} rounded-2xl flex items-center justify-center shadow-glow`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-text-primary">{config.title}</h3>
                    <p className="text-sm text-text-muted">
                      Atual: {config.isCurrency 
                        ? `R$ ${config.current.toLocaleString('pt-BR')}`
                        : config.current.toLocaleString('pt-BR')
                      } {config.suffix}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-text-muted">Progresso</span>
                    <span className="text-sm font-bold text-text-primary">{Math.round(percentage)}%</span>
                  </div>
                  <div className={`w-full h-3 ${progressBg} rounded-full overflow-hidden`}>
                    <div 
                      className={`h-full bg-gradient-to-r ${progressColor} rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-text-muted">Meta:</label>
                  {config.isCurrency ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-text-muted">R$</span>
                      <input
                        type="number"
                        value={goals[config.field]}
                        onChange={(e) => setGoals({ ...goals, [config.field]: Number(e.target.value) })}
                        className="w-28 px-3 py-1.5 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-xl text-sm text-text-primary focus:border-primary-400 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all duration-200"
                      />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={goals[config.field]}
                      onChange={(e) => setGoals({ ...goals, [config.field]: Number(e.target.value) })}
                      className="w-28 px-3 py-1.5 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-xl text-sm text-text-primary focus:border-primary-400 focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all duration-200"
                    />
                  )}
                  <span className="text-sm text-text-muted">{config.suffix}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-glass">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="w-5 h-5 text-accent" />
          <h2 className="text-xl font-bold text-text-primary">Resumo do Progresso</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {goalsConfig.map((config) => {
            const percentage = config.invertProgress
              ? Math.min(100, (config.value > 0 ? (config.value / Math.max(config.current, config.value)) * 100 : 0))
              : Math.min(100, (config.current / config.value) * 100)
            return (
              <div key={config.field} className="text-center p-4 glass rounded-2xl">
                <p className="text-2xl font-bold text-text-primary">{Math.round(percentage)}%</p>
                <p className="text-xs text-text-muted mt-1">{config.title}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
