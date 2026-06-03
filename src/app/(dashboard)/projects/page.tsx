'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProjectCalculator } from '@/components/features/ProjectCalculator'
import type { Project } from '@/types'
import { SERVICE_TYPES, DEADLINE_OPTIONS, parseProject } from '@/types'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCalculator, setShowCalculator] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
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
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return

    try {
      const { error } = await supabase.from('projects').delete().eq('id', id)
      if (error) throw error
      fetchProjects()
    } catch (error) {
      console.error('Erro ao excluir projeto:', error)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-600">Calculadora de projetos e propostas</p>
        </div>
        <Button onClick={() => setShowCalculator(!showCalculator)}>
          {showCalculator ? 'Ver Projetos' : '+ Novo Projeto'}
        </Button>
      </div>

      {showCalculator ? (
        <ProjectCalculator onProjectSaved={() => {
          fetchProjects()
          setShowCalculator(false)
        }} />
      ) : (
        <>
          {/* Lista de Projetos */}
          <Card>
            <CardContent>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhum projeto ainda
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Crie seu primeiro projeto usando a calculadora
                  </p>
                  <Button onClick={() => setShowCalculator(true)}>
                    Criar Projeto
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Nome</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Tipo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Páginas</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Prazo</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Valor</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((project) => (
                        <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{project.name}</td>
                          <td className="py-3 px-4">
                            {SERVICE_TYPES[project.service_type]?.label || project.service_type}
                          </td>
                          <td className="py-3 px-4">{project.pages}</td>
                          <td className="py-3 px-4">
                            {DEADLINE_OPTIONS[project.deadline]?.label || project.deadline}
                          </td>
                          <td className="py-3 px-4 font-semibold text-green-600">
                            {formatCurrency(project.calculated_value)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : project.status === 'proposed'
                                ? 'bg-blue-100 text-blue-700'
                                : project.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {project.status === 'approved' ? 'Aprovado' :
                               project.status === 'proposed' ? 'Proposta' :
                               project.status === 'rejected' ? 'Rejeitado' : 'Calculando'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleDeleteProject(project.id)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
