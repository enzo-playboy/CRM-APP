'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { RevenueManual, RevenueCategory, PaymentMethod, RevenueStatus } from '@/types'
import { REVENUE_CATEGORIES, PAYMENT_METHODS, REVENUE_STATUS } from '@/types'

interface RevenueFormProps {
  onRevenueCreated?: () => void
  revenueToEdit?: RevenueManual | null
  onEditCancel?: () => void
}

export function RevenueForm({ onRevenueCreated, revenueToEdit, onEditCancel }: RevenueFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    customer_name: '',
    customer_email: '',
    category: 'projeto' as RevenueCategory,
    payment_method: 'pix' as PaymentMethod,
    status: 'received' as RevenueStatus,
    date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (revenueToEdit) {
      setFormData({
        description: revenueToEdit.description,
        amount: revenueToEdit.amount.toString(),
        customer_name: revenueToEdit.customer_name || '',
        customer_email: revenueToEdit.customer_email || '',
        category: revenueToEdit.category,
        payment_method: revenueToEdit.payment_method,
        status: revenueToEdit.status,
        date: revenueToEdit.date,
        notes: revenueToEdit.notes || '',
      })
    }
  }, [revenueToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (revenueToEdit) {
        // Modo edição
        const { error } = await supabase
          .from('revenue_manual')
          .update({
            description: formData.description,
            amount: parseFloat(formData.amount),
            customer_name: formData.customer_name || null,
            customer_email: formData.customer_email || null,
            category: formData.category,
            payment_method: formData.payment_method,
            status: formData.status,
            date: formData.date,
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', revenueToEdit.id)

        if (error) throw error
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onEditCancel?.()
          onRevenueCreated?.()
        }, 1500)
      } else {
        // Modo criação
        const { error } = await supabase.from('revenue_manual').insert({
          description: formData.description,
          amount: parseFloat(formData.amount),
          customer_name: formData.customer_name || null,
          customer_email: formData.customer_email || null,
          category: formData.category,
          payment_method: formData.payment_method,
          status: formData.status,
          date: formData.date,
          notes: formData.notes || null,
          user_id: user?.id,
        })

        if (error) throw error
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setFormData({
            description: '',
            amount: '',
            customer_name: '',
            customer_email: '',
            category: 'projeto',
            payment_method: 'pix',
            status: 'received',
            date: new Date().toISOString().split('T')[0],
            notes: '',
          })
          onRevenueCreated?.()
        }, 1500)
      }
    } catch (error) {
      console.error('Erro ao salvar receita:', error)
      alert('Erro ao salvar receita. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      description: '',
      amount: '',
      customer_name: '',
      customer_email: '',
      category: 'projeto',
      payment_method: 'pix',
      status: 'received',
      date: new Date().toISOString().split('T')[0],
      notes: '',
    })
    onEditCancel?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{revenueToEdit ? 'Editar Receita' : 'Nova Receita Manual'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Projeto Site Institucional"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0,00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data *</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                placeholder="Nome do cliente"
              />
            </div>
            <div className="space-y-2">
              <Label>Email do Cliente</Label>
              <Input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(REVENUE_CATEGORIES).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: key as RevenueCategory })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      formData.category === key
                        ? color === 'blue' ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : color === 'purple' ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                        : color === 'amber' ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-500 bg-gray-50 text-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PAYMENT_METHODS).map(([key, { label, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: key as PaymentMethod })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      formData.payment_method === key
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex gap-2">
                {Object.entries(REVENUE_STATUS).map(([key, { label, color }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFormData({ ...formData, status: key as RevenueStatus })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      formData.status === key
                        ? color === 'yellow' ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : color === 'green' ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observações sobre a receita..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
          </div>

          {showSuccess ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-medium">
                {revenueToEdit ? 'Receita atualizada!' : 'Receita cadastrada com sucesso!'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              {revenueToEdit && (
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="flex-1" isLoading={isSaving}>
                {revenueToEdit ? 'Salvar Alterações' : 'Cadastrar Receita'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
