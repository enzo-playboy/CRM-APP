'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, MessageSquare, Mail, MessageCircle, Workflow, ArrowDown, ArrowUp } from 'lucide-react'
import type { Conversa, Lead } from '@/types'

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversa[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [selectedLead, setSelectedLead] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [conversationsResult, leadsResult] = await Promise.all([
        supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('leads')
          .select('*')
          .order('name'),
      ])

      setConversations(conversationsResult.data || [])
      setLeads(leadsResult.data || [])
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />
      case 'email':
        return <Mail className="w-4 h-4 text-blue-500" />
      case 'chat':
        return <MessageCircle className="w-4 h-4 text-purple-500" />
      case 'n8n':
        return <Workflow className="w-4 h-4 text-orange-500" />
      default:
        return <MessageSquare className="w-4 h-4 text-gray-500" />
    }
  }

  const getChannelColor = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case 'whatsapp':
        return 'bg-emerald-100 text-emerald-700'
      case 'email':
        return 'bg-blue-100 text-blue-700'
      case 'chat':
        return 'bg-purple-100 text-purple-700'
      case 'n8n':
        return 'bg-orange-100 text-orange-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const getDirectionConfig = (direction: string) => {
    if (direction === 'inbound') {
      return {
        icon: <ArrowDown className="w-3 h-3" />,
        color: 'bg-blue-100 text-blue-700',
        label: 'Recebida'
      }
    }
    return {
      icon: <ArrowUp className="w-3 h-3" />,
      color: 'bg-emerald-100 text-emerald-700',
      label: 'Enviada'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hoje'
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ontem'
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const filteredConversations = conversations.filter((conversation) => {
    const matchesLead = selectedLead === 'all' || conversation.lead_id === selectedLead
    const matchesSearch = searchQuery === '' || 
      conversation.content?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesLead && matchesSearch
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-gradient">Mensagens</h1>
        <p className="text-text-muted mt-1">Histórico de conversas com seus contatos</p>
      </div>

      {/* Filtros */}
      <div className="glass rounded-3xl p-4 shadow-glass">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <Input
              placeholder="Buscar nas mensagens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <div className="w-full lg:w-64">
            <Select value={selectedLead} onValueChange={setSelectedLead}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por contato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os contatos</SelectItem>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name || lead.email || lead.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Conversas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Conversas
            <Badge variant="secondary" className="ml-2">
              {filteredConversations.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-text-muted/30 mx-auto mb-4" />
              <p className="text-text-muted">Nenhuma conversa encontrada</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {filteredConversations.map((conversation) => {
                  const lead = leads.find((l) => l.id === conversation.lead_id)
                  const directionConfig = getDirectionConfig(conversation.direction)
                  
                  return (
                    <div
                      key={conversation.id}
                      className="p-4 rounded-2xl border border-white/30 hover:bg-white/50 transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-semibold text-text-primary">
                              {lead?.name || lead?.email || 'Contato desconhecido'}
                            </span>
                            <Badge variant="outline" className={directionConfig.color}>
                              {directionConfig.icon}
                              <span className="ml-1">{directionConfig.label}</span>
                            </Badge>
                            <Badge variant="outline" className={getChannelColor(conversation.channel)}>
                              {getChannelIcon(conversation.channel)}
                              <span className="ml-1">{conversation.channel}</span>
                            </Badge>
                          </div>
                          <p className="text-text-muted text-sm line-clamp-2">{conversation.content}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-xs text-text-muted">
                            {formatTime(conversation.created_at)}
                          </span>
                          <span className="text-xs text-text-muted">
                            {formatDate(conversation.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
