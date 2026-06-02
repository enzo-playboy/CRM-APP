'use client'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '@/store'
import { fetchRevenues, fetchManualRevenues, deleteManualRevenue, setPeriod } from '@/store/slices/financialSlice'
import { RevenueForm } from '@/components/features/RevenueForm'
import { PeriodFilter } from '@/components/features/PeriodFilter'
import type { RevenueManual } from '@/types'
import { REVENUE_CATEGORIES, PAYMENT_METHODS, REVENUE_STATUS } from '@/types'

type TabType = 'all' | 'stripe' | 'manual'

export default function RevenuePage() {
  const dispatch = useDispatch<AppDispatch>()
  const { revenues, manualRevenues, period, isLoading } = useSelector((state: RootState) => state.financial)
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [revenueToEdit, setRevenueToEdit] = useState<RevenueManual | null>(null)

  useEffect(() => {
    dispatch(fetchRevenues(period))
    dispatch(fetchManualRevenues(period))
  }, [dispatch, period])

  const handlePeriodChange = (newPeriod: { startDate: string; endDate: string }) => {
    dispatch(setPeriod(newPeriod))
  }

  const handleRevenueCreated = () => {
    dispatch(fetchManualRevenues(period))
  }

  const handleDelete = (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta receita?')) return
    dispatch(deleteManualRevenue(id))
  }

  const handleEdit = (revenue: RevenueManual) => {
    setRevenueToEdit(revenue)
  }

  const handleEditCancel = () => {
    setRevenueToEdit(null)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const totalStripe = revenues.reduce((sum, r) => sum + r.amount, 0)
  const totalManual = manualRevenues.reduce((sum, r) => sum + r.amount, 0)
  const totalAll = totalStripe + totalManual

  const filteredManualRevenues = manualRevenues

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Receitas</h1>
        <p className="text-gray-600">Pagamentos, faturas e receitas manuais</p>
      </div>

      <PeriodFilter period={period} onPeriodChange={handlePeriodChange} />

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Stripe</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalStripe)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Manuais</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalManual)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalAll)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <RevenueForm
            onRevenueCreated={handleRevenueCreated}
            revenueToEdit={revenueToEdit}
            onEditCancel={handleEditCancel}
          />
        </div>

        {/* Lista de Receitas */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200 pb-2">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Todas ({revenues.length + manualRevenues.length})
              </button>
              <button
                onClick={() => setActiveTab('stripe')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'stripe'
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Stripe ({revenues.length})
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Manuais ({manualRevenues.length})
              </button>
            </div>

            {/* Lista Stripe */}
            {(activeTab === 'all' || activeTab === 'stripe') && revenues.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Receitas Stripe
                </h3>
                <div className="space-y-2">
                  {revenues.map((revenue) => (
                    <div
                      key={revenue.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          revenue.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                          revenue.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {revenue.status === 'succeeded' ? 'Pago' :
                           revenue.status === 'pending' ? 'Pendente' : 'Falhou'}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{revenue.description || revenue.customer_name || 'Stripe'}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(revenue.created_at).toLocaleDateString('pt-BR')}
                            {revenue.customer_email && ` • ${revenue.customer_email}`}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-600">
                        +{formatCurrency(revenue.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista Manual */}
            {(activeTab === 'all' || activeTab === 'manual') && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Receitas Manuais
                </h3>
                {filteredManualRevenues.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Nenhuma receita manual cadastrada</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredManualRevenues.map((revenue) => {
                      const catConfig = REVENUE_CATEGORIES[revenue.category]
                      const paymentConfig = PAYMENT_METHODS[revenue.payment_method]
                      const statusConfig = REVENUE_STATUS[revenue.status]
                      return (
                        <div
                          key={revenue.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              statusConfig.color === 'green' ? 'bg-green-100 text-green-700' :
                              statusConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {statusConfig.label}
                            </span>
                            <div>
                              <p className="font-medium text-gray-900">{revenue.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(revenue.date).toLocaleDateString('pt-BR')}
                                {revenue.customer_name && ` • ${revenue.customer_name}`}
                                {' • '}{catConfig.label}
                                {' • '}{paymentConfig.icon} {paymentConfig.label}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold text-green-600">
                              +{formatCurrency(revenue.amount)}
                            </span>
                            <button
                              onClick={() => handleEdit(revenue)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              title="Editar"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(revenue.id)}
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
            )}

            {/* Lista vazia */}
            {activeTab === 'stripe' && revenues.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma receita Stripe no período</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
