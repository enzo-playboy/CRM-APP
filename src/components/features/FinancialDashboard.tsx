'use client'

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import type { FinancialSummary } from '@/types'

interface FinancialDashboardProps {
  summary: FinancialSummary
}

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export function FinancialDashboard({ summary }: FinancialDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass rounded-3xl p-6 shadow-glass">
          <p className="text-sm text-text-muted font-medium mb-2">Total Receitas</p>
          <p className="text-3xl font-bold text-emerald-500">
            {formatCurrency(summary.totalRevenue)}
          </p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass">
          <p className="text-sm text-text-muted font-medium mb-2">Total Despesas</p>
          <p className="text-3xl font-bold text-red-500">
            {formatCurrency(summary.totalExpenses)}
          </p>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass">
          <p className="text-sm text-text-muted font-medium mb-2">Lucro Líquido</p>
          <p className={`text-3xl font-bold ${summary.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {formatCurrency(summary.netProfit)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass rounded-3xl p-6 shadow-glass">
          <h3 className="text-lg font-bold text-text-primary mb-4">Receitas vs Despesas por Mês</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.revenueByMonth.map((item, index) => ({
                month: item.month,
                receitas: item.amount,
                despesas: summary.expensesByMonth[index]?.amount || 0,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.3)" />
                <XAxis dataKey="month" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    background: 'rgba(255,255,255,0.9)', 
                    border: 'none', 
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="receitas" fill="#6366F1" name="Receitas" radius={[8, 8, 0, 0]} />
                <Bar dataKey="despesas" fill="#EF4444" name="Despesas" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-3xl p-6 shadow-glass">
          <h3 className="text-lg font-bold text-text-primary mb-4">Despesas por Categoria</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={summary.expensesByCategory.filter(item => item.amount > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="amount"
                >
                  {summary.expensesByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
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
        </div>
      </div>
    </div>
  )
}
