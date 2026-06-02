'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Expense, ExpenseCategory } from '@/types'

interface ExpenseFormProps {
  onExpenseCreated?: () => void
  expenseToEdit?: Expense | null
  onEditCancel?: () => void
}

export function ExpenseForm({ onExpenseCreated, expenseToEdit, onEditCancel }: ExpenseFormProps) {
  const [formData, setFormData] = useState({
    category: 'variavel' as ExpenseCategory,
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    recurring: false,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        category: expenseToEdit.category,
        description: expenseToEdit.description,
        amount: expenseToEdit.amount.toString(),
        date: expenseToEdit.date,
        recurring: expenseToEdit.recurring,
      })
    }
  }, [expenseToEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.description || !formData.amount) return

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (expenseToEdit) {
        // Modo edição
        const { error } = await supabase
          .from('expenses')
          .update({
            category: formData.category,
            description: formData.description,
            amount: parseFloat(formData.amount),
            date: formData.date,
            recurring: formData.recurring,
            updated_at: new Date().toISOString(),
          })
          .eq('id', expenseToEdit.id)

        if (error) throw error
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onEditCancel?.()
          onExpenseCreated?.()
        }, 1500)
      } else {
        // Modo criação
        const { error } = await supabase.from('expenses').insert({
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
          recurring: formData.recurring,
          user_id: user?.id,
        })

        if (error) throw error
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          setFormData({
            category: 'variavel',
            description: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            recurring: false,
          })
          onExpenseCreated?.()
        }, 1500)
      }
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
      alert('Erro ao salvar despesa. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      category: 'variavel',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      recurring: false,
    })
    onEditCancel?.()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expenseToEdit ? 'Editar Despesa' : 'Nova Despesa'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria
            </label>
            <div className="flex gap-2">
              {(['fixa', 'variavel', 'projeto'] as ExpenseCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat })}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.category === cat
                      ? cat === 'fixa'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : cat === 'variavel'
                        ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                        : 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {cat === 'fixa' ? 'Fixa' : cat === 'variavel' ? 'Variável' : 'Projeto'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Aluguel, Ferramenta X, etc."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor (R$)</Label>
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
              <Label>Data</Label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.recurring}
              onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Despesa recorrente (mensal)</span>
          </label>

          {showSuccess ? (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-700 font-medium">
                {expenseToEdit ? 'Despesa atualizada!' : 'Despesa cadastrada com sucesso!'}
              </p>
            </div>
          ) : (
            <div className="flex gap-2">
              {expenseToEdit && (
                <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="flex-1" isLoading={isSaving}>
                {expenseToEdit ? 'Salvar Alterações' : 'Cadastrar Despesa'}
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
