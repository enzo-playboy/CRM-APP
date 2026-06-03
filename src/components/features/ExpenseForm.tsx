'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Expense, ExpenseCategory, Lead } from '@/types'

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

  // Estados adicionais para parcelamento e associação com cliente (Lead)
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState('')
  const [isInstallments, setIsInstallments] = useState(false)
  const [installmentsCount, setInstallmentsCount] = useState(2)

  useEffect(() => {
    const fetchLeadsList = async () => {
      try {
        const { data } = await supabase
          .from('leads')
          .select('id, name, company')
          .order('name', { ascending: true })
        setLeads((data || []) as Lead[])
      } catch (err) {
        console.error('Erro ao buscar leads para despesa:', err)
      }
    }
    fetchLeadsList()
  }, [])

  useEffect(() => {
    if (expenseToEdit) {
      setFormData({
        category: expenseToEdit.category,
        description: expenseToEdit.description,
        amount: expenseToEdit.amount.toString(),
        date: expenseToEdit.date,
        recurring: expenseToEdit.recurring,
      })
      setSelectedLeadId(expenseToEdit.lead_id || '')
      setIsInstallments(false)
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
            lead_id: selectedLeadId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', expenseToEdit.id)

        if (error) {
          console.warn("Falha ao salvar despesa com lead_id, tentando fallback sem a coluna...", error)
          // Fallback se a coluna lead_id não existir no banco remoto
          const { error: fallbackError } = await supabase
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
          if (fallbackError) throw fallbackError
        }
        setShowSuccess(true)
        setTimeout(() => {
          setShowSuccess(false)
          onEditCancel?.()
          onExpenseCreated?.()
        }, 1500)
      } else {
        // Modo criação
        if (isInstallments && installmentsCount > 1) {
          const totalAmount = parseFloat(formData.amount)
          const installmentAmount = parseFloat((totalAmount / installmentsCount).toFixed(2))
          const baseDate = new Date(formData.date + 'T12:00:00') // evitar timezone shift

          // Tentar inserir com lead_id
          try {
            const expensePromises = []
            for (let i = 0; i < installmentsCount; i++) {
              const installmentDate = new Date(baseDate)
              installmentDate.setMonth(baseDate.getMonth() + i)
              const dateStr = installmentDate.toISOString().split('T')[0]

              expensePromises.push(
                supabase.from('expenses').insert({
                  category: formData.category,
                  description: `${formData.description} (${i + 1}/${installmentsCount})`,
                  amount: installmentAmount,
                  date: dateStr,
                  recurring: false,
                  lead_id: selectedLeadId || null,
                  user_id: user?.id,
                })
              )
            }

            const results = await Promise.all(expensePromises)
            const errorResult = results.find(r => r.error)
            if (errorResult) throw errorResult.error
          } catch (err) {
            console.warn("Falha ao salvar parcelas com lead_id, tentando fallback sem a coluna...", err)
            // Fallback sem a coluna lead_id
            const expensePromises = []
            for (let i = 0; i < installmentsCount; i++) {
              const installmentDate = new Date(baseDate)
              installmentDate.setMonth(baseDate.getMonth() + i)
              const dateStr = installmentDate.toISOString().split('T')[0]

              expensePromises.push(
                supabase.from('expenses').insert({
                  category: formData.category,
                  description: `${formData.description} (${i + 1}/${installmentsCount})`,
                  amount: installmentAmount,
                  date: dateStr,
                  recurring: false,
                  user_id: user?.id,
                })
              )
            }
            const results = await Promise.all(expensePromises)
            const errorResult = results.find(r => r.error)
            if (errorResult) throw errorResult.error
          }
        } else {
          const { error } = await supabase.from('expenses').insert({
            category: formData.category,
            description: formData.description,
            amount: parseFloat(formData.amount),
            date: formData.date,
            recurring: formData.recurring,
            lead_id: selectedLeadId || null,
            user_id: user?.id,
          })

          if (error) {
            console.warn("Falha ao salvar despesa com lead_id, tentando fallback sem a coluna...", error)
            // Fallback se a coluna lead_id não existir no banco remoto
            const { error: fallbackError } = await supabase.from('expenses').insert({
              category: formData.category,
              description: formData.description,
              amount: parseFloat(formData.amount),
              date: formData.date,
              recurring: formData.recurring,
              user_id: user?.id,
            })
            if (fallbackError) throw fallbackError
          }
        }

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
          setSelectedLeadId('')
          setIsInstallments(false)
          setInstallmentsCount(2)
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
    setSelectedLeadId('')
    setIsInstallments(false)
    setInstallmentsCount(2)
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

          <div className="space-y-2">
            <Label>Vincular a Cliente (Opcional)</Label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhum cliente</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} {l.company ? `(${l.company})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{isInstallments ? 'Valor Total (R$)' : 'Valor (R$)'}</Label>
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

          {!expenseToEdit && (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isInstallments}
                  onChange={(e) => {
                    setIsInstallments(e.target.checked)
                    if (e.target.checked) {
                      setFormData(prev => ({ ...prev, recurring: false }))
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 font-medium">Dividir esta despesa em parcelas</span>
              </label>

              {isInstallments && (
                <div className="flex items-center gap-3">
                  <Label htmlFor="installments_count" className="text-xs text-gray-600">Número de parcelas:</Label>
                  <Input
                    id="installments_count"
                    type="number"
                    min="2"
                    max="60"
                    value={installmentsCount}
                    onChange={(e) => setInstallmentsCount(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-20 h-8 text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.recurring}
              disabled={isInstallments}
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
