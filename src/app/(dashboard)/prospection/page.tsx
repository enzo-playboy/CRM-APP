'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Target,
  Filter,
  Calendar,
  Flame,
  Sun,
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
  LineChart,
  Line,
  Legend
} from 'recharts'

interface PipelineStage {
  stage: string
  label: string
  count: number
  value: number
  percentage: number
  color: string
  icon: React.ElementType
}

export default function ProspectionPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filterPeriod, setFilterPeriod] = useState('3m')
  const [filterTemp, setFilterTemp] = useState('')
  const [filterNicho, setFilterNicho] = useState('')

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
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesTemp = !filterTemp || lead.temperatura === filterTemp
    const matchesNicho = !filterNicho || lead.nicho === filterNicho
    return matchesTemp && matchesNicho
  })

  const totalLeads = filteredLeads.length
  const hotLeads = filteredLeads.filter(l => l.temperatura === 'quente').length
  const clients = filteredLeads.filter(l => l.estado === 'client').length
  const conversionRate = totalLeads > 0 ? ((clients / totalLeads) * 100).toFixed(1) : '0'

  const pipelineStages: PipelineStage[] = [
    { 
      stage: 'novo', 
      label: 'Novo Lead', 
      count: filteredLeads.filter(l => l.estado === 'lead' && l.temperatura === 'frio').length,
      value: 0,
      percentage: 0,
      color: 'from-primary-500 to-primary-400',
      icon: Users
    },
    { 
      stage: 'contato', 
      label: 'Em Contato', 
      count: filteredLeads.filter(l => l.estado === 'lead' && l.temperatura === 'morno').length,
      value: 0,
      percentage: 0,
      color: 'from-amber-500 to-yellow-400',
      icon: Sun
    },
    { 
      stage: 'proposta', 
      label: 'Proposta', 
      count: filteredLeads.filter(l => l.estado === 'lead' && l.temperatura === 'quente').length,
      value: 0,
      percentage: 0,
      color: 'from-orange-500 to-red-400',
      icon: Flame
    },
    { 
      stage: 'fechado', 
      label: 'Fechado', 
      count: clients,
      value: 0,
      percentage: 0,
      color: 'from-emerald-500 to-green-400',
      icon: Target
    },
  ]

  const totalPipeline = pipelineStages.reduce((acc, s) => acc + s.count, 0)
  pipelineStages.forEach(stage => {
    stage.percentage = totalPipeline > 0 ? (stage.count / totalPipeline) * 100 : 0
  })

  const monthlyData = [
    { month: 'Jan', leads: 45, conversoes: 12 },
    { month: 'Fev', leads: 52, conversoes: 15 },
    { month: 'Mar', leads: 61, conversoes: 18 },
    { month: 'Abr', leads: 48, conversoes: 14 },
    { month: 'Mai', leads: 73, conversoes: 22 },
    { month: 'Jun', leads: totalLeads, conversoes: clients },
  ]

  const nichos = [...new Set(leads.map(l => l.nicho).filter(Boolean))]

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
        <h1 className="text-3xl font-bold text-gradient">Prospecção de Leads</h1>
        <p className="text-text-muted mt-1">Acompanhe seu pipeline de vendas e métricas de conversão.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-400 rounded-2xl flex items-center justify-center shadow-glow">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Total Pipeline</p>
              <p className="text-3xl font-bold text-text-primary">{totalLeads}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-400 rounded-2xl flex items-center justify-center shadow-glow">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Taxa Conversão</p>
              <p className="text-3xl font-bold text-text-primary">{conversionRate}%</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center shadow-glow">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Leads Quentes</p>
              <p className="text-3xl font-bold text-text-primary">{hotLeads}</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass hover:shadow-glass-lg transition-all duration-300 hover:-translate-y-1">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-violet-400 rounded-2xl flex items-center justify-center shadow-glow">
              <Target className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-sm text-text-muted font-medium">Clientes</p>
              <p className="text-3xl font-bold text-text-primary">{clients}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-4 shadow-glass">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl text-text-primary focus:border-primary-400 outline-none"
            >
              <option value="1m">Último mês</option>
              <option value="3m">Últimos 3 meses</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="1a">Último ano</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary-500" />
            <select
              value={filterTemp}
              onChange={(e) => setFilterTemp(e.target.value)}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl text-text-primary focus:border-primary-400 outline-none"
            >
              <option value="">Temperatura: Todas</option>
              <option value="quente">Quente</option>
              <option value="morno">Morno</option>
              <option value="frio">Frio</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filterNicho}
              onChange={(e) => setFilterNicho(e.target.value)}
              className="px-4 py-2 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl text-text-primary focus:border-primary-400 outline-none"
            >
              <option value="">Nicho: Todos</option>
              {nichos.map(nicho => (
                <option key={nicho} value={nicho}>{nicho}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-glass">
        <h2 className="text-xl font-bold text-text-primary mb-6">Pipeline de Prospecção</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {pipelineStages.map((stage) => {
            const Icon = stage.icon
            return (
              <div key={stage.stage} className="glass rounded-2xl p-4 hover:shadow-glass transition-all duration-300">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 bg-gradient-to-br ${stage.color} rounded-xl flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-text-primary">{stage.count}</p>
                    <p className="text-xs text-text-muted">{stage.label}</p>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${stage.color} rounded-full`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-text-muted mt-2">{stage.percentage.toFixed(0)}% do pipeline</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6 shadow-glass">
          <h2 className="text-xl font-bold text-text-primary mb-4">Funil de Conversão</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineStages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis type="number" stroke="#6B7280" />
                <YAxis dataKey="label" type="category" stroke="#6B7280" width={100} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Bar dataKey="count" fill="#6366F1" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass">
          <h2 className="text-xl font-bold text-text-primary mb-4">Evolução Mensal</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={3} dot={{ fill: '#6366F1' }} />
                <Line type="monotone" dataKey="conversoes" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 shadow-glass">
        <h2 className="text-xl font-bold text-text-primary mb-4">Leads por Temperatura</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="glass rounded-2xl p-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{hotLeads}</p>
            <p className="text-sm text-text-muted">Quentes</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Sun className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{filteredLeads.filter(l => l.temperatura === 'morno').length}</p>
            <p className="text-sm text-text-muted">Mornos</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Snowflake className="w-6 h-6 text-white" />
            </div>
            <p className="text-2xl font-bold text-text-primary">{filteredLeads.filter(l => l.temperatura === 'frio').length}</p>
            <p className="text-sm text-text-muted">Frios</p>
          </div>
        </div>
      </div>
    </div>
  )
}
