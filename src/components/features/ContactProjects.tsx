'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Project } from '@/types'
import { SERVICE_TYPES, parseProject } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProjectCalculator } from './ProjectCalculator'
import { Plus, Trash2, Calculator, ChevronDown, ChevronUp } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

interface ContactProjectsProps {
  leadId: string
  onProjectCreated?: () => void
}

export function ContactProjects({ leadId, onProjectCreated }: ContactProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [leadId])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects((data || []).map(parseProject))
    } catch (error) {
      console.error('Erro ao buscar projetos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async (id: string) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      setProjects(projects.filter((p) => p.id !== id))
      toast.success('Projeto excluído!')
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
      toast.error('Erro ao excluir projeto')
    }
  }

  const handleProjectSaved = () => {
    fetchProjects()
    setShowCalculator(false)
    onProjectCreated?.()
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getStatusBadge = (status: Project['status']) => {
    const config = {
      calculating: { label: 'Calculando', variant: 'secondary' as const },
      proposed: { label: 'Proposto', variant: 'outline' as const },
      approved: { label: 'Aprovado', variant: 'default' as const },
      rejected: { label: 'Rejeitado', variant: 'destructive' as const },
    }
    return config[status] || config.proposed
  }

  const getServiceLabel = (serviceType: string) => {
    return SERVICE_TYPES[serviceType as keyof typeof SERVICE_TYPES]?.label || serviceType
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Projetos ({projects.length})
        </h3>
        <Button
          size="sm"
          onClick={() => setShowCalculator(!showCalculator)}
        >
          {showCalculator ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Fechar
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-1" />
              Novo Projeto
            </>
          )}
        </Button>
      </div>

      {showCalculator && (
        <Card>
          <CardContent className="p-4">
            <ProjectCalculator
              preSelectedLeadId={leadId}
              onProjectSaved={handleProjectSaved}
            />
          </CardContent>
        </Card>
      )}

      {projects.length === 0 && !showCalculator ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum projeto cadastrado</p>
            <Button
              size="sm"
              className="mt-4"
              onClick={() => setShowCalculator(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Criar Primeiro Projeto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map((project) => {
            const statusConfig = getStatusBadge(project.status)
            return (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{project.name}</h4>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Tipo: <span className="font-medium">{getServiceLabel(project.service_type)}</span>
                          {' • '}
                          Páginas: <span className="font-medium">{project.pages}</span>
                        </p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(project.calculated_value)}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(project.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
