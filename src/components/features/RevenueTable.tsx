'use client'

import type { Revenue } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

interface RevenueTableProps {
  revenues: Revenue[]
  isLoading: boolean
}

export function RevenueTable({ revenues, isLoading }: RevenueTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: Revenue['status']) => {
    const styles = {
      succeeded: 'bg-green-100 text-green-700',
      pending: 'bg-yellow-100 text-yellow-700',
      failed: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    }
    const labels = {
      succeeded: 'Pago',
      pending: 'Pendente',
      failed: 'Falhou',
      refunded: 'Reembolsado',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const getTypeBadge = (type: Revenue['type']) => {
    const styles = {
      payment: 'bg-blue-100 text-blue-700',
      invoice: 'bg-purple-100 text-purple-700',
      subscription: 'bg-indigo-100 text-indigo-700',
    }
    const labels = {
      payment: 'Pagamento',
      invoice: 'Fatura',
      subscription: 'Assinatura',
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type]}`}>
        {labels[type]}
      </span>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receitas (Stripe)</CardTitle>
      </CardHeader>
      <CardContent>
        {revenues.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma receita encontrada no período</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Data</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Descrição</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-600">Valor</th>
                </tr>
              </thead>
              <tbody>
                {revenues.map((revenue) => (
                  <tr key={revenue.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(revenue.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{revenue.customer_name || '-'}</p>
                        <p className="text-xs text-gray-500">{revenue.customer_email || '-'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 max-w-[200px] truncate">
                      {revenue.description || '-'}
                    </td>
                    <td className="py-3 px-4">{getTypeBadge(revenue.type)}</td>
                    <td className="py-3 px-4">{getStatusBadge(revenue.status)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-600">
                      {formatCurrency(revenue.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
