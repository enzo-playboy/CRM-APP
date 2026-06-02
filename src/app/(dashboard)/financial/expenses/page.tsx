'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { fetchExpenses, setPeriod, deleteExpense } from '@/store/slices/financialSlice'
import { ExpenseForm } from '@/components/features/ExpenseForm'
import { PeriodFilter } from '@/components/features/PeriodFilter'
import type { Expense } from '@/types'
import { EXPENSE_CATEGORIES } from '@/types'

export default function ExpensesPage() {
  const dispatch = useDispatch<AppDispatch>()
  const { expenses, period, isLoading } = useSelector((state: RootState) => state.financial)
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)

  useEffect(() => {
    dispatch(fetchExpenses(period))
  }, [dispatch, period])

  const handlePeriodChange = (newPeriod: { startDate: string; endDate: string }) => {
    dispatch(setPeriod(newPeriod))
  }

  const handleExpenseCreated = () => {
    dispatch(fetchExpenses(period))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta despesa?')) return
    dispatch(deleteExpense(id))
  }

  const handleEdit = (expense: Expense) => {
    setExpenseToEdit(expense)
  }

  const handleEditCancel = () => {
    setExpenseToEdit(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
        <p className="text-gray-600">Cadastro e gerenciamento de despesas</p>
      </div>

      <PeriodFilter period={period} onPeriodChange={handlePeriodChange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <ExpenseForm
            onExpenseCreated={handleExpenseCreated}
            expenseToEdit={expenseToEdit}
            onEditCancel={handleEditCancel}
          />
        </div>

        {/* Lista de Despesas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-900">Despesas do Período</h3>
              <span className="text-sm text-gray-600">
                Total: <span className="font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
              </span>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma despesa cadastrada</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expenses.map((expense: Expense) => {
                  const catConfig = EXPENSE_CATEGORIES[expense.category]
                  return (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          catConfig.color === 'red' ? 'bg-red-100 text-red-700' :
                          catConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {catConfig.label}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{expense.description}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(expense.date).toLocaleDateString('pt-BR')}
                            {expense.recurring && ' • Recorrente'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-red-600">
                          -{formatCurrency(expense.amount)}
                        </span>
                        <button
                          onClick={() => handleEdit(expense)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="text-red-600 hover:text-red-700 text-sm"
                          title="Excluir"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
