'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ContactMessages } from '@/components/features/ContactMessages'
import { ContactProjects } from '@/components/features/ContactProjects'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { Switch } from '@/components/ui/switch'
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Globe,
  Flame,
  Sun,
  Snowflake,
  CheckCircle,
  Clock,
  XCircle,
  Edit,
  Save,
  X,
  Trash2,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
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

export default function ContactDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { markAsRead } = useUnreadMessages()
  const id = params.id as string

  const [lead, setLead] = useState<Lead | null>(null)
  const [messagesCount, setMessagesCount] = useState(0)
  const [projectsCount, setProjectsCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState<Partial<Lead>>({})

  useEffect(() => {
    fetchLead()
    fetchCounts()
  }, [id])

  const fetchLead = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      const formattedLead = {
        ...data,
        estado: (data.estado || '').toLowerCase(),
        notes: data.notes || data.metadata?.notes || '',
        tags: data.tags || data.metadata?.tags || [],
        temperatura: (data.temperatura || data.Temperatura || '').toLowerCase()
      }
      setLead(formattedLead)
      setEditData(formattedLead)
    } catch (error) {
      console.error('Erro ao buscar contato:', error)
      toast.error('Erro ao carregar contato')
      router.push('/contacts')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCounts = async () => {
    const [messagesRes, projectsRes] = await Promise.all([
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('lead_id', id),
      supabase.from('projects').select('*', { count: 'exact', head: true }).eq('lead_id', id),
    ])
    setMessagesCount(messagesRes.count || 0)
    setProjectsCount(projectsRes.count || 0)
  }

  const handleSave = async () => {
    try {
      const { temperatura, Temperatura, email, instagram, phone, company, nicho, notes, tags, ...restEditData } = editData as any
      
      const formattedEmail = email?.trim() || null
      const formattedInstagram = instagram?.trim() || null
      const formattedPhone = phone?.trim() || null
      const formattedCompany = company?.trim() || null
      const formattedNicho = nicho?.trim() || null
      
      const finalTemp = (temperatura || Temperatura || '').toUpperCase()
      
      const { error } = await supabase
        .from('leads')
        .update({
          ...restEditData,
          email: formattedEmail,
          instagram: formattedInstagram,
          phone: formattedPhone,
          company: formattedCompany,
          nicho: formattedNicho,
          tags: tags || [],
          Temperatura: finalTemp || null,
          metadata: {
            ...(restEditData.metadata || {}),
            notes: notes || null,
            tags: tags || [],
          }
        })
        .eq('id', id)

      if (error) throw error
      setLead(editData as Lead)
      setIsEditing(false)
      toast.success('Contato atualizado!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      toast.error('Erro ao salvar')
    }
  }

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      toast.success('Contato excluído!')
      router.push('/contacts')
    } catch (error) {
      console.error('Erro ao excluir:', error)
      toast.error('Erro ao excluir')
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getTemperatureConfig = (temp: string) => {
    switch (temp) {
      case 'quente': return { bg: 'bg-red-100', text: 'text-red-600', icon: Flame, label: 'Quente' }
      case 'morno': return { bg: 'bg-amber-100', text: 'text-amber-600', icon: Sun, label: 'Morno' }
      default: return { bg: 'bg-blue-100', text: 'text-blue-600', icon: Snowflake, label: 'Frio' }
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'client': return { icon: CheckCircle, text: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Cliente' }
      case 'lead': return { icon: Clock, text: 'text-primary-500', bg: 'bg-primary-100', label: 'Lead' }
      default: return { icon: XCircle, text: 'text-gray-400', bg: 'bg-gray-100', label: 'Inativo' }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
      </div>
    )
  }

  if (!lead) return null

  const tempConfig = getTemperatureConfig(lead.temperatura || 'frio')
  const statusConfig = getStatusConfig(lead.estado || 'lead')
  const TempIcon = tempConfig.icon
  const StatusIcon = statusConfig.icon

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/contacts')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                {getInitials(lead.name || 'U')}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{lead.name || 'Sem nome'}</h1>
                <p className="text-sm text-gray-500 mt-1">{lead.company || 'Sem empresa'}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig.label}
                  </Badge>
                  <Badge variant="outline" className={`${tempConfig.bg} ${tempConfig.text} border-0`}>
                    <TempIcon className="w-3 h-3 mr-1" />
                    {tempConfig.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Salvar
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setIsEditing(false); setEditData(lead) }}>
                  <X className="w-4 h-4 mr-1" />
                  Cancelar
                </Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <Tabs defaultValue="profile">
          <div className="border-b border-gray-100 px-6 pt-4">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              <TabsTrigger 
                value="profile" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
              >
                Perfil
              </TabsTrigger>
              <TabsTrigger 
                value="messages"
                onClick={() => markAsRead(id)}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
              >
                Mensagens ({messagesCount})
              </TabsTrigger>
              <TabsTrigger 
                value="projects"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary-500 data-[state=active]:bg-transparent data-[state=active]:shadow-none px-6 py-3"
              >
                Projetos ({projectsCount})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab Perfil */}
          <TabsContent value="profile" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Info Principal */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Informações de Contato</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail className="w-4 h-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="flex-1 px-3 py-1 border rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-700">{lead.email || '-'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="flex-1 px-3 py-1 border rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-700">{lead.phone || '-'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      value={editData.company || ''}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="flex-1 px-3 py-1 border rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-700">{lead.company || '-'}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {isEditing ? (
                    <input
                      value={editData.instagram || ''}
                      onChange={(e) => setEditData({ ...editData, instagram: e.target.value })}
                      className="flex-1 px-3 py-1 border rounded-lg"
                    />
                  ) : (
                    <span className="text-gray-700">{lead.instagram || '-'}</span>
                  )}
                 </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Possui Site:</span>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={editData.metadata?.has_website || false}
                      onCheckedChange={(checked) => setEditData({
                        ...editData,
                        metadata: {
                          ...(editData.metadata || {}),
                          has_website: checked
                        }
                      })}
                    />
                  ) : (
                    <Badge variant={lead.metadata?.has_website ? "default" : "secondary"}>
                      {lead.metadata?.has_website ? "Sim" : "Não"}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Flame className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">Possui Automação:</span>
                  </div>
                  {isEditing ? (
                    <Switch
                      checked={editData.metadata?.has_automation || false}
                      onCheckedChange={(checked) => setEditData({
                        ...editData,
                        metadata: {
                          ...(editData.metadata || {}),
                          has_automation: checked
                        }
                      })}
                    />
                  ) : (
                    <Badge variant={lead.metadata?.has_automation ? "default" : "secondary"}>
                      {lead.metadata?.has_automation ? "Sim" : "Não"}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Status e Classificação</h3>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                  <span className="text-sm text-gray-500 w-20">Status:</span>
                  {isEditing ? (
                    <Select
                      value={editData.estado || 'lead'}
                      onValueChange={(value) => setEditData({ ...editData, estado: value as Lead['estado'] })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="client">Cliente</SelectItem>
                        <SelectItem value="inactive">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium">{statusConfig.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <TempIcon className={`w-4 h-4 ${tempConfig.text}`} />
                  <span className="text-sm text-gray-500 w-20">Temperatura:</span>
                  {isEditing ? (
                    <Select
                      value={editData.temperatura || 'frio'}
                      onValueChange={(value) => setEditData({ ...editData, temperatura: value as Lead['temperatura'] })}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">Quente</SelectItem>
                        <SelectItem value="morno">Morno</SelectItem>
                        <SelectItem value="frio">Frio</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="font-medium">{tempConfig.label}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg flex-wrap">
                  <span className="text-sm text-gray-500 w-20">Tags:</span>
                  {isEditing ? (
                    <input
                      value={editData.tags?.join(', ') || ''}
                      onChange={(e) => setEditData({ ...editData, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      placeholder="Ex: Contato Inicial, Conversando"
                      className="flex-1 px-3 py-1 border rounded-lg text-sm bg-white"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {(lead.tags || lead.metadata?.tags || []).length > 0 ? (
                        (lead.tags || lead.metadata?.tags || []).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 text-[10px]">
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">Nenhuma tag</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Criado em:</p>
                  <p className="text-gray-700">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              {/* Observações / Anotações */}
              <div className="md:col-span-2 p-4 bg-white border border-gray-200 rounded-xl space-y-2">
                <p className="text-sm font-semibold text-gray-700">Observações / Anotações</p>
                {isEditing ? (
                  <textarea
                    value={editData.notes || ''}
                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                    placeholder="Adicione anotações e observações sobre este contato..."
                    rows={4}
                    className="w-full px-4 py-3 border rounded-xl text-gray-700"
                  />
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg min-h-[80px]">
                    {lead.notes || lead.metadata?.notes || 'Nenhuma observação cadastrada.'}
                  </p>
                )}
              </div>

              {/* Histórico de Pagamento */}
              {(lead.historico_pagamento || lead.metadata?.historico_pagamento) && (
                <div className="md:col-span-2 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                  <p className="text-sm font-semibold text-amber-700 mb-2">Histórico de Pagamento</p>
                  <p className="text-sm text-amber-800 whitespace-pre-wrap">{lead.historico_pagamento || lead.metadata?.historico_pagamento}</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab Mensagens */}
          <TabsContent value="messages" className="p-6">
            <ContactMessages leadId={id} />
          </TabsContent>

          {/* Tab Projetos */}
          <TabsContent value="projects" className="p-6">
            <ContactProjects leadId={id} onProjectCreated={fetchCounts} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
