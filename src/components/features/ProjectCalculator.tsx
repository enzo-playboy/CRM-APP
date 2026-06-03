'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { 
  CalculatorData, 
  ServiceType, 
  Deadline, 
  Feature, 
  Lead
} from '@/types'
import { SERVICE_TYPES, DEADLINE_OPTIONS, FEATURE_OPTIONS } from '@/types'

interface ProjectCalculatorProps {
  onProjectSaved?: () => void
  preSelectedLeadId?: string
}

export function ProjectCalculator({ onProjectSaved, preSelectedLeadId }: ProjectCalculatorProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [calculatorData, setCalculatorData] = useState<CalculatorData>({
    serviceType: 'landing_page',
    pages: 5,
    deadline: 'normal',
    features: [],
  })
  const [projectName, setProjectName] = useState('')
  const [projectNotes, setProjectNotes] = useState('')
  const [calculatedValue, setCalculatedValue] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (preSelectedLeadId) {
      setSelectedLeadId(preSelectedLeadId)
    }
  }, [preSelectedLeadId])

  useEffect(() => {
    calculateValue()
  }, [calculatorData])

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('leads')
      .select('*')
      .order('name')
    
    setLeads(data || [])
  }

  const calculateValue = () => {
    const serviceConfig = SERVICE_TYPES[calculatorData.serviceType]
    const deadlineConfig = DEADLINE_OPTIONS[calculatorData.deadline]
    
    // Base value
    let baseValue = serviceConfig.baseValue
    
    // Pages cost (R$ 500 per page after 5 pages)
    const extraPages = Math.max(0, calculatorData.pages - 5)
    const pagesCost = extraPages * 500
    
    // Deadline multiplier
    const deadlineMultiplier = deadlineConfig.multiplier
    
    // Features cost
    const featuresCost = calculatorData.features.reduce((total, feature) => {
      return total + FEATURE_OPTIONS[feature].value
    }, 0)

    // Final calculation
    const finalValue = (baseValue + pagesCost) * deadlineMultiplier + featuresCost
    
    setCalculatedValue(finalValue)
  }

  const handleFeatureToggle = (feature: Feature) => {
    setCalculatorData(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      alert('Por favor, insira um nome para o projeto')
      return
    }

    setIsSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      const projectData = {
        name: projectName,
        description: projectNotes,
        lead_id: selectedLeadId || null,
        service_type: calculatorData.serviceType,
        pages: calculatorData.pages,
        deadline: calculatorData.deadline,
        features: calculatorData.features,
        calculated_value: calculatedValue,
        status: 'proposed' as const,
        user_id: user?.id,
      }

      let insertResult = await supabase.from('projects').insert(projectData)

      if (insertResult.error) {
        if (insertResult.error.code === 'PGRST204' || insertResult.error.code === '42703') {
          const serializedProject = {
            name: projectName,
            description: projectNotes,
            service_type: calculatorData.serviceType,
            pages: calculatorData.pages,
            deadline: calculatorData.deadline,
            features: calculatorData.features,
            calculated_value: calculatedValue
          }
          const fallbackData = {
            name: `__JSON__:${JSON.stringify(serializedProject)}`,
            lead_id: selectedLeadId || null,
            status: 'proposed' as const
          }
          const fallbackResult = await supabase.from('projects').insert(fallbackData)
          if (fallbackResult.error) throw fallbackResult.error
        } else {
          throw insertResult.error
        }
      }

      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setProjectName('')
        setProjectNotes('')
        setSelectedLeadId('')
        onProjectSaved?.()
      }, 2000)
    } catch (error) {
      console.error('Erro ao salvar projeto:', error)
      alert('Erro ao salvar projeto. Tente novamente.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calculator Form */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Serviço
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(SERVICE_TYPES) as [ServiceType, typeof SERVICE_TYPES[ServiceType]][]).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setCalculatorData(prev => ({ ...prev, serviceType: key }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    calculatorData.serviceType === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="font-medium">{config.label}</span>
                  <span className="block text-xs text-gray-500 mt-1">
                    {formatCurrency(config.baseValue)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Number of Pages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Número de Páginas
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCalculatorData(prev => ({ 
                  ...prev, 
                  pages: Math.max(1, prev.pages - 1) 
                }))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                -
              </button>
              <Input
                type="number"
                min="1"
                max="100"
                value={calculatorData.pages}
                onChange={(e) => setCalculatorData(prev => ({ 
                  ...prev, 
                  pages: Math.max(1, parseInt(e.target.value) || 1) 
                }))}
                className="w-20 text-center"
              />
              <button
                onClick={() => setCalculatorData(prev => ({ 
                  ...prev, 
                  pages: Math.min(100, prev.pages + 1) 
                }))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
              >
                +
              </button>
              {calculatorData.pages > 5 && (
                <span className="text-sm text-gray-500">
                  (+{formatCurrency((calculatorData.pages - 5) * 500)})
                </span>
              )}
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prazo
            </label>
            <div className="space-y-2">
              {(Object.entries(DEADLINE_OPTIONS) as [Deadline, typeof DEADLINE_OPTIONS[Deadline]][]).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                    calculatorData.deadline === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="deadline"
                    value={key}
                    checked={calculatorData.deadline === key}
                    onChange={(e) => setCalculatorData(prev => ({ 
                      ...prev, 
                      deadline: e.target.value as Deadline 
                    }))}
                    className="mr-3"
                  />
                  <div>
                    <span className="font-medium">{config.label}</span>
                    <span className="text-sm text-gray-500 ml-2">
                      (x{config.multiplier})
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Features */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Funcionalidades
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(FEATURE_OPTIONS) as [Feature, typeof FEATURE_OPTIONS[Feature]][]).map(([key, config]) => (
                <label
                  key={key}
                  className={`flex items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                    calculatorData.features.includes(key)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={calculatorData.features.includes(key)}
                    onChange={() => handleFeatureToggle(key)}
                    className="mr-2"
                  />
                  <span className="text-sm">{config.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result & Save */}
      <Card>
        <CardHeader>
          <CardTitle>Resultado e Salvamento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Calculated Value */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
            <p className="text-sm opacity-90">Valor Calculado</p>
            <p className="text-4xl font-bold mt-2">{formatCurrency(calculatedValue)}</p>
            <div className="mt-4 text-sm opacity-75">
              <p>{SERVICE_TYPES[calculatorData.serviceType].label}</p>
              <p>{calculatorData.pages} páginas • {DEADLINE_OPTIONS[calculatorData.deadline].label}</p>
              {calculatorData.features.length > 0 && (
                <p>{calculatorData.features.length} funcionalidade(s)</p>
              )}
            </div>
          </div>

          {/* Save Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Projeto *</Label>
              <Input
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Ex: Site Institucional Full IA"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vincular a Contato (opcional)
              </label>
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                disabled={!!preSelectedLeadId}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Nenhum contato selecionado</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.name || lead.email || lead.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas do Projeto
              </label>
              <textarea
                value={projectNotes}
                onChange={(e) => setProjectNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Observações sobre o projeto..."
              />
            </div>

            {showSuccess ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-green-700 font-medium">Projeto salvo com sucesso!</p>
              </div>
            ) : (
              <Button
                onClick={handleSaveProject}
                disabled={isSaving || !projectName.trim()}
                className="w-full"
                isLoading={isSaving}
              >
                Salvar Projeto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
