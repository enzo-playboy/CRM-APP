'use client'

import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { fetchExpenses, fetchRevenues, setPeriod } from '@/store/slices/financialSlice'
import { FinancialDashboard } from '@/components/features/FinancialDashboard'
import { PeriodFilter } from '@/components/features/PeriodFilter'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import type { Expense } from '@/types'
import { EXPENSE_CATEGORIES } from '@/types'

export default function FinancialPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { expenses, summary, period, isLoading } = useSelector((state: RootState) => state.financial)

  useEffect(() => {
    dispatch(fetchExpenses(period))
    dispatch(fetchRevenues(period))
  }, [dispatch, period])

  const handlePeriodChange = (newPeriod: { startDate: string; endDate: string }) => {
    dispatch(setPeriod(newPeriod))
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    const { deleteExpense } = await import('@/store/slices/financialSlice')
    dispatch(deleteExpense(id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p className="text-gray-600">Contas da empresa - Receitas e Despesas</p>
      </div>

      {/* Filtro de Período */}
      <PeriodFilter period={period} onPeriodChange={handlePeriodChange} />

      {/* Dashboard com Gráficos */}
      <FinancialDashboard summary={summary} />

      {/* Tabela de Despesas */}
      <Card>
        <CardHeader>
          <CardTitle>Despesas do Período</CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma despesa encontrada no período</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Categoria</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Recorrente</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense: Expense) => {
                    const catConfig = EXPENSE_CATEGORIES[expense.category]
                    return (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          {new Date(expense.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            catConfig.color === 'red' ? 'bg-red-100 text-red-700' :
                            catConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {catConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">{expense.description}</td>
                        <td className="py-3 px-4">
                          {expense.recurring ? (
                            <span className="text-green-600 text-sm">Sim</span>
                          ) : (
                            <span className="text-gray-400 text-sm">Não</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Excluir
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
