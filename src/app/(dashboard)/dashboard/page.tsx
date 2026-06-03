'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Flame,
  Eye,
  ArrowRight,
  CheckCircle,
  Clock,
  Snowflake
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dailyGoalStats, setDailyGoalStats] = useState({
    todayLeads: 0,
    dailyGoal: 0,
  })
  const [stats, setStats] = useState({
    totalLeads: 0,
    conversionRate: 0,
    monthlyRevenue: 0,
    goalProgress: 0,
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const formattedLeads = (data || []).map((lead: any) => ({
        ...lead,
        estado: (lead.estado || '').toLowerCase(),
        temperatura: (lead.temperatura || lead.Temperatura || '').toLowerCase()
      }))
      setLeads(formattedLeads)

      const total = formattedLeads.length
      const clientsCount = formattedLeads.filter(l => l.estado === 'client').length
      const conversionRate = total > 0 ? (clientsCount / total) * 100 : 0

      // Buscar metas de leads ativa
      const currentMonth = new Date().getMonth() + 1
      const currentYear = new Date().getFullYear()
      const { data: { user } } = await supabase.auth.getUser()
      let monthlyGoal = 100
      let dailyGoal = 0
      
      if (user) {
        const { data: goalData } = await supabase
          .from('goals')
          .select('*')
          .eq('user_id', user.id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .single()
        if (goalData) {
          monthlyGoal = goalData.monthly_leads_goal || 100
          dailyGoal = goalData.daily_leads_goal || 0
        }
      }

      const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local format
      const todayLeadsCount = formattedLeads.filter((l: any) => {
        if (!l.created_at) return false
        const leadDate = new Date(l.created_at).toLocaleDateString('en-CA')
        return leadDate === today
      }).length

      setDailyGoalStats({
        todayLeads: todayLeadsCount,
        dailyGoal: dailyGoal,
      })

      const goalProgress = monthlyGoal > 0 ? (total / monthlyGoal) * 100 : 0

      setStats({
        totalLeads: total,
        conversionRate: Number(conversionRate.toFixed(1)),
        monthlyRevenue: 32000,
        goalProgress: Math.min(100, Math.round(goalProgress)),
      })
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const hotLeads = leads.filter(l => l.temperatura === 'quente').length
  const warmLeads = leads.filter(l => l.temperatura === 'morno').length
  const coldLeads = leads.filter(l => l.temperatura === 'frio').length
  const clients = leads.filter(l => l.estado === 'client').length

  const tempData = [
    { name: 'Quentes', value: hotLeads, color: '#EF4444' },
    { name: 'Mornos', value: warmLeads, color: '#F59E0B' },
    { name: 'Frios', value: coldLeads, color: '#3B82F6' },
  ]

  const pipelineData = [
    { stage: 'Novo', count: leads.filter(l => l.estado === 'lead' && l.temperatura === 'frio').length },
    { stage: 'Contato', count: leads.filter(l => l.estado === 'lead' && l.temperatura === 'morno').length },
    { stage: 'Proposta', count: leads.filter(l => l.estado === 'lead' && l.temperatura === 'quente').length },
    { stage: 'Fechado', count: clients },
  ]

  const recentLeads = leads.slice(0, 5)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Dashboard</h1>
        <p className="text-text-muted mt-1">Visão geral do seu pipeline de prospecção.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center shadow-glow">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Total Leads</p>
              <p className="text-3xl font-bold text-text-primary">{stats.totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl flex items-center justify-center shadow-glow">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Taxa Conversão</p>
              <p className="text-3xl font-bold text-text-primary">{stats.conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-glow">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Receita Mês</p>
              <p className="text-3xl font-bold text-text-primary">R$ {(stats.monthlyRevenue / 1000).toFixed(0)}k</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-400 rounded-2xl flex items-center justify-center shadow-glow">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Meta Mês</p>
              <p className="text-3xl font-bold text-text-primary">{stats.goalProgress}%</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-400 rounded-2xl flex items-center justify-center shadow-glow">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Meta Diária</p>
              <p className="text-3xl font-bold text-text-primary">
                {dailyGoalStats.todayLeads} / {dailyGoalStats.dailyGoal}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-glass">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-text-primary">Leads Recentes</h2>
          <a href="/contacts" className="flex items-center gap-1 text-primary-500 hover:text-primary-600 font-semibold text-sm transition-colors">
            Ver todos <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        {recentLeads.length === 0 ? (
          <p className="text-text-muted text-center py-8">Nenhum lead encontrado</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-sm">Nome</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-sm">Empresa</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-sm">Temperatura</th>
                  <th className="text-left py-3 px-4 font-semibold text-text-muted text-sm">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b border-white/20 hover:bg-white/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-text-primary">{lead.name || '-'}</td>
                    <td className="py-3 px-4 text-text-muted">{lead.company || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.temperatura === 'quente' ? 'bg-red-100 text-red-600' :
                        lead.temperatura === 'morno' ? 'bg-amber-100 text-amber-600' :
                        'bg-blue-100 text-blue-600'
                      }`}>
                        {lead.temperatura === 'quente' && <Flame className="w-3 h-3" />}
                        {lead.temperatura === 'morno' && <span className="w-3 h-3">☀️</span>}
                        {lead.temperatura === 'frio' && <Snowflake className="w-3 h-3" />}
                        {lead.temperatura || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        lead.estado === 'client' ? 'bg-emerald-100 text-emerald-600' :
                        lead.estado === 'lead' ? 'bg-primary-100 text-primary-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {lead.estado || 'lead'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6 shadow-glass">
          <h2 className="text-xl font-bold text-text-primary mb-4">Funil de Prospecção</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="stage" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass">
          <h2 className="text-xl font-bold text-text-primary mb-4">Leads por Temperatura</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tempData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tempData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {tempData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-sm text-text-muted">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-glass">
        <div className="flex items-center gap-3 mb-4">
          <Target className="w-5 h-5 text-primary-500" />
          <h2 className="text-xl font-bold text-text-primary">Progresso das Metas</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Leads</span>
              <span className="text-sm font-bold text-text-primary">45%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Receita</span>
              <span className="text-sm font-bold text-text-primary">64%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full" style={{ width: '64%' }} />
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Projetos</span>
              <span className="text-sm font-bold text-text-primary">70%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full" style={{ width: '70%' }} />
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-text-muted">Resposta</span>
              <span className="text-sm font-bold text-text-primary">85%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-violet-400 rounded-full" style={{ width: '85%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
