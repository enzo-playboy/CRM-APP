'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Lead } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { UnreadBadge } from '@/components/ui/UnreadBadge'
import { useUnreadMessages } from '@/hooks/useUnreadMessages'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  Flame,
  Sun,
  Snowflake,
  Eye,
  Trash2,
  User,
  Edit,
  Save,
  X,
  MessageSquare,
  Kanban,
  LayoutGrid
} from 'lucide-react'
import { toast } from 'sonner'

export default function ContactsPage() {
  const router = useRouter()
  const { unreadCounts } = useUnreadMessages()
  const [leads, setLeads] = useState<Lead[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDetailsModal, setShowDetailsModal] = useState<Lead | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterTemperatura, setFilterTemperatura] = useState<string>('all')
  
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list')
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<'novo' | 'contato' | 'proposta' | 'client' | 'inactive' | null>(null)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)

  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    nicho: '',
    instagram: '',
    estado: 'lead',
    temperatura: 'frio',
    historico_pagamento: '',
    has_automation: false,
    has_website: false,
    tags: [] as string[],
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingId, editingField])

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      
      const formattedLeads = (data || []).map((lead: any) => ({
        ...lead,
        estado: (lead.estado || '').toLowerCase(),
        temperatura: (lead.temperatura || lead.Temperatura || '').toLowerCase()
      }))
      setLeads(formattedLeads)
    } catch (error) {
      console.error('Erro ao buscar leads:', error)
      toast.error('Erro ao carregar contatos')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { historico_pagamento, temperatura, has_automation, has_website, tags, ...leadData } = newLead
      
      // Formatar campos para NULL se estiverem vazios para evitar erro de UNIQUE no email e limpar strings vazias
      const formattedEmail = leadData.email?.trim() || null
      const formattedPhone = leadData.phone?.trim() || null
      const formattedCompany = leadData.company?.trim() || null
      const formattedNicho = leadData.nicho?.trim() || null
      const formattedInstagram = leadData.instagram?.trim() || null

      const { error } = await supabase.from('leads').insert({
        ...leadData,
        email: formattedEmail,
        phone: formattedPhone,
        company: formattedCompany,
        nicho: formattedNicho,
        instagram: formattedInstagram,
        tags: tags || [],
        Temperatura: temperatura ? temperatura.toUpperCase() : null,
        metadata: {
          historico_pagamento,
          has_automation,
          has_website,
          tags: tags || [],
        },
        user_id: user?.id,
      })
      if (error) throw error
      setShowAddModal(false)
      setNewLead({
        name: '', email: '', phone: '', company: '', nicho: '',
        instagram: '', estado: 'lead', temperatura: 'frio', historico_pagamento: '',
        has_automation: false, has_website: false, tags: [] as string[]
      })
      fetchLeads()
      toast.success('Contato adicionado com sucesso!')
    } catch (error: any) {
      console.error('Erro ao adicionar lead:', error)
      toast.error(`Erro ao adicionar contato: ${error.message || error.description || JSON.stringify(error)}`)
    }
  }

  const handleDeleteLead = async (id: string) => {
    try {
      const { error } = await supabase.from('leads').delete().eq('id', id)
      if (error) throw error
      fetchLeads()
      toast.success('Contato excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir lead:', error)
      toast.error('Erro ao excluir contato')
    }
  }

  const startEditing = (id: string, field: string, currentValue: string) => {
    setEditingId(id)
    setEditingField(field)
    setEditingValue(currentValue || '')
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingField) return
    try {
      const { error } = await supabase
        .from('leads')
        .update({ [editingField]: editingValue })
        .eq('id', editingId)
      if (error) throw error
      setLeads(leads.map(lead => 
        lead.id === editingId ? { ...lead, [editingField]: editingValue } : lead
      ))
      setEditingId(null)
      setEditingField(null)
      toast.success('Campo atualizado!')
    } catch (error) {
      console.error('Erro ao salvar edição:', error)
      toast.error('Erro ao salvar')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    else if (e.key === 'Escape') { setEditingId(null); setEditingField(null) }
  }

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.nicho?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.instagram?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesEstado = filterEstado === 'all' || lead.estado === filterEstado
    const matchesTemperatura = filterTemperatura === 'all' || lead.temperatura === filterTemperatura
    return matchesSearch && matchesEstado && matchesTemperatura
  })

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

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId)
    setDraggedLeadId(leadId)
  }

  const handleDragOver = (e: React.DragEvent, stage: 'novo' | 'contato' | 'proposta' | 'client' | 'inactive') => {
    e.preventDefault()
    setDragOverColumn(stage)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStage: 'novo' | 'contato' | 'proposta' | 'client' | 'inactive') => {
    e.preventDefault()
    setDragOverColumn(null)
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId
    if (!leadId) return

    const leadToUpdate = leads.find(l => l.id === leadId)
    if (!leadToUpdate) return

    // Calcular novo estado e temperatura
    let targetEstado: 'lead' | 'client' | 'inactive' = 'lead'
    let targetTemperatura: 'frio' | 'morno' | 'quente' = 'frio'

    if (targetStage === 'novo') {
      targetEstado = 'lead'
      targetTemperatura = 'frio'
    } else if (targetStage === 'contato') {
      targetEstado = 'lead'
      targetTemperatura = 'morno'
    } else if (targetStage === 'proposta') {
      targetEstado = 'lead'
      targetTemperatura = 'quente'
    } else if (targetStage === 'client') {
      targetEstado = 'client'
      targetTemperatura = 'quente'
    } else if (targetStage === 'inactive') {
      targetEstado = 'inactive'
      targetTemperatura = 'frio'
    }

    // Optimistic update
    const previousLeads = [...leads]
    setLeads(leads.map(lead => 
      lead.id === leadId ? { ...lead, estado: targetEstado, temperatura: targetTemperatura } : lead
    ))

    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          estado: targetEstado,
          Temperatura: targetTemperatura.toUpperCase()
        })
        .eq('id', leadId)

      if (error) throw error
      toast.success(`Etapa de ${leadToUpdate.name || 'Contato'} atualizada!`)
    } catch (error) {
      console.error('Erro ao atualizar status do lead:', error)
      setLeads(previousLeads)
      toast.error('Erro ao atualizar status do lead')
    } finally {
      setDraggedLeadId(null)
    }
  }

  const renderKanbanColumn = (stage: 'novo' | 'contato' | 'proposta' | 'client' | 'inactive', title: string, colorClasses: string) => {
    const columnLeads = filteredLeads.filter(lead => {
      const estado = lead.estado || 'lead'
      const temp = lead.temperatura || 'frio'
      if (stage === 'novo') return estado === 'lead' && temp === 'frio'
      if (stage === 'contato') return estado === 'lead' && temp === 'morno'
      if (stage === 'proposta') return estado === 'lead' && temp === 'quente'
      return estado === stage
    })
    const isOver = dragOverColumn === stage

    return (
      <div 
        onDragOver={(e) => handleDragOver(e, stage)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, stage)}
        className={`glass rounded-3xl p-4 min-h-[500px] w-72 shrink-0 md:w-80 flex flex-col gap-4 transition-all duration-200 border-t-4 ${colorClasses} ${isOver ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-background scale-[1.01] bg-primary-100/10' : ''}`}
      >
        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/20">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${
              stage === 'novo' ? 'bg-blue-400' :
              stage === 'contato' ? 'bg-amber-400' :
              stage === 'proposta' ? 'bg-orange-400' :
              stage === 'client' ? 'bg-emerald-500' :
              'bg-gray-400'
            }`} />
            <h3 className="font-bold text-text-primary text-sm truncate">{title}</h3>
          </div>
          <Badge variant="secondary" className="bg-white/40 text-text-primary border-0 rounded-full font-bold text-xs shrink-0">
            {columnLeads.length}
          </Badge>
        </div>

        <ScrollArea className="flex-1 max-h-[600px] pr-1">
          <div className="flex flex-col gap-3 p-1">
            {columnLeads.map(lead => {
              const tempConfig = getTemperatureConfig(lead.temperatura || 'frio')
              const TempIcon = tempConfig.icon
              const isLeadDragged = draggedLeadId === lead.id

              return (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  onClick={() => router.push(`/contacts/${lead.id}`)}
                  className={`group relative p-3.5 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl hover:shadow-glass hover:bg-white hover:border-primary-200 cursor-grab active:cursor-grabbing transition-all duration-200 ${
                    isLeadDragged ? 'opacity-40 border-dashed border-primary-300' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-2 gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8.5 h-8.5 shrink-0 rounded-xl bg-gradient-to-br from-primary-300 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-xs">
                        {getInitials(lead.name || 'U')}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-text-primary truncate group-hover:text-primary-600 transition-colors">
                          {lead.name || 'Sem nome'}
                        </h4>
                        <p className="text-[10px] text-text-muted truncate">
                          {lead.company || 'Sem empresa'}
                        </p>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className={`${tempConfig.bg} ${tempConfig.text} border-0 text-[9px] px-1.5 py-0.5 shrink-0 font-medium`}>
                      <TempIcon className="w-2 h-2 mr-0.5" />
                      {tempConfig.label}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-1 text-[10px] text-text-muted mt-2 border-t border-white/30 pt-2">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3 h-3 text-primary-400 shrink-0" />
                      <span className="truncate">{lead.email || 'Sem email'}</span>
                    </div>
                    {lead.nicho && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-primary-400 shrink-0" />
                        <span className="truncate">{lead.nicho}</span>
                      </div>
                    )}
                    {/* Renderização das tags do Lead */}
                    {((lead.tags && lead.tags.length > 0) || (lead.metadata?.tags && lead.metadata.tags.length > 0)) && (
                      <div className="flex flex-wrap gap-0.5 mt-1.5">
                        {(lead.tags || lead.metadata?.tags || []).map((tag: string) => (
                          <span key={tag} className="bg-primary-50 text-primary-700 border border-primary-100 rounded-md text-[8px] px-1 py-0.2 font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {(lead.metadata?.has_website || lead.metadata?.has_automation) && (
                      <div className="flex gap-1 mt-1">
                        {lead.metadata?.has_website && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-[8px] px-1 py-0.2 font-semibold">
                            Site
                          </span>
                        )}
                        {lead.metadata?.has_automation && (
                          <span className="bg-purple-50 text-purple-700 border border-purple-100 rounded-md text-[8px] px-1 py-0.2 font-semibold">
                            Automação
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {columnLeads.length === 0 && (
              <div className="text-center py-8 border border-dashed border-white/30 rounded-2xl bg-white/20">
                <p className="text-xs text-text-muted">Nenhum lead nesta etapa</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Contatos</h1>
          <p className="text-text-muted mt-1">Gerencie seus leads e contatos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/50 border border-white/40 p-1 rounded-xl shadow-sm">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className={`rounded-lg h-8 px-3 font-semibold ${
                viewMode === 'kanban' 
                  ? 'bg-white text-text-primary shadow-sm hover:bg-white' 
                  : 'text-text-muted hover:text-text-primary hover:bg-white/30'
              }`}
            >
              <Kanban className="w-4 h-4 mr-1.5" />
              Kanban
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={`rounded-lg h-8 px-3 font-semibold ${
                viewMode === 'list' 
                  ? 'bg-white text-text-primary shadow-sm hover:bg-white' 
                  : 'text-text-muted hover:text-text-primary hover:bg-white/30'
              }`}
            >
              <LayoutGrid className="w-4 h-4 mr-1.5" />
              Lista
            </Button>
          </div>
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Contato
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
              <DialogDescription>
                Adicione um novo contato ao CRM
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Empresa</Label>
                  <Input
                    id="company"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nicho">Nicho</Label>
                  <Input
                    id="nicho"
                    value={newLead.nicho}
                    onChange={(e) => setNewLead({ ...newLead, nicho: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <Input
                    id="instagram"
                    value={newLead.instagram}
                    onChange={(e) => setNewLead({ ...newLead, instagram: e.target.value })}
                    placeholder="@usuario"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newLead.estado} onValueChange={(value) => setNewLead({ ...newLead, estado: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="client">Cliente</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Temperatura</Label>
                  <Select value={newLead.temperatura} onValueChange={(value) => setNewLead({ ...newLead, temperatura: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quente">Quente</SelectItem>
                      <SelectItem value="morno">Morno</SelectItem>
                      <SelectItem value="frio">Frio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl">
                  <Label htmlFor="has_website" className="cursor-pointer text-xs font-semibold text-text-secondary">Possui Site?</Label>
                  <Switch
                    id="has_website"
                    checked={newLead.has_website}
                    onCheckedChange={(checked) => setNewLead({ ...newLead, has_website: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl">
                  <Label htmlFor="has_automation" className="cursor-pointer text-xs font-semibold text-text-secondary">Possui Automação?</Label>
                  <Switch
                    id="has_automation"
                    checked={newLead.has_automation}
                    onCheckedChange={(checked) => setNewLead({ ...newLead, has_automation: checked })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  value={newLead.tags?.join(', ') || ''}
                  onChange={(e) => setNewLead({ ...newLead, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  placeholder="Ex: Contato Inicial, Conversando"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historico">Histórico de Pagamento</Label>
                <textarea
                  id="historico"
                  value={newLead.historico_pagamento}
                  onChange={(e) => setNewLead({ ...newLead, historico_pagamento: e.target.value })}
                  rows={3}
                  placeholder="Informações sobre pagamentos..."
                  className="w-full px-4 py-3 bg-white/70 backdrop-blur-sm border-2 border-white/50 rounded-2xl text-text-primary placeholder:text-text-muted/60 focus:border-primary-400 focus:bg-white focus:ring-2 focus:ring-primary-200 focus:outline-none transition-all duration-200 resize-none"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Salvar</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>

      {/* Filtros */}
      <div className="glass rounded-3xl p-4 shadow-glass">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Buscar contatos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <div className="flex gap-3">
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="client">Cliente</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
                <SelectItem value="inactive">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterTemperatura} onValueChange={setFilterTemperatura}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Temperatura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="quente">Quente</SelectItem>
                <SelectItem value="morno">Morno</SelectItem>
                <SelectItem value="frio">Frio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista / Kanban de Contatos */}
      {viewMode === 'kanban' ? (
        <div className="flex overflow-x-auto gap-4 pb-4 items-start max-w-full scrollbar-thin">
          {renderKanbanColumn('novo', 'Novo Lead', 'border-t-primary-400 bg-primary-50/5')}
          {renderKanbanColumn('contato', 'Em Contato', 'border-t-amber-400 bg-amber-50/5')}
          {renderKanbanColumn('proposta', 'Proposta', 'border-t-orange-400 bg-orange-50/5')}
          {renderKanbanColumn('client', 'Clientes', 'border-t-emerald-400 bg-emerald-50/5')}
          {renderKanbanColumn('inactive', 'Inativos', 'border-t-gray-300 bg-gray-50/5')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLeads.map((lead) => {
            const tempConfig = getTemperatureConfig(lead.temperatura || 'frio')
            const statusConfig = getStatusConfig(lead.estado || 'lead')
            const TempIcon = tempConfig.icon
            const StatusIcon = statusConfig.icon
            
            return (
              <Card key={lead.id} className="hover:shadow-glass-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-300 to-primary-200 flex items-center justify-center text-primary-700 font-bold text-lg">
                          {getInitials(lead.name || 'U')}
                        </div>
                        {unreadCounts[lead.id] > 0 && (
                          <div className="absolute -top-1 -right-1">
                            <UnreadBadge count={unreadCounts[lead.id]} />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">{lead.name || 'Sem nome'}</h3>
                        <p className="text-sm text-text-muted">{lead.company || 'Sem empresa'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={`${tempConfig.bg} ${tempConfig.text} border-0`}>
                      <TempIcon className="w-3 h-3 mr-1" />
                      {tempConfig.label}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2 text-sm text-text-muted mb-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-primary-400" />
                      <span className="truncate">{lead.email || 'Sem email'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${statusConfig.text}`} />
                      <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    {((lead.tags && lead.tags.length > 0) || (lead.metadata?.tags && lead.metadata.tags.length > 0)) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(lead.tags || lead.metadata?.tags || []).map((tag: string) => (
                          <Badge key={tag} variant="outline" className="bg-primary-50 text-primary-700 border-primary-200 rounded-lg text-[10px] px-2 py-0.5 font-semibold">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {(lead.metadata?.has_website || lead.metadata?.has_automation) && (
                      <div className="flex gap-1.5 mt-1">
                        {lead.metadata?.has_website && (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 rounded-lg text-[10px] px-2 py-0.5 font-semibold">
                            Possui Site
                          </Badge>
                        )}
                        {lead.metadata?.has_automation && (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 rounded-lg text-[10px] px-2 py-0.5 font-semibold">
                            Possui Automação
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-white/30">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => router.push(`/contacts/${lead.id}`)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Ver
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir contato?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O contato será removido permanentemente do sistema.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteLead(lead.id)}
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

      {filteredLeads.length === 0 && (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
          <p className="text-text-muted">Nenhum contato encontrado</p>
        </div>
      )}
    </div>
  )
}
