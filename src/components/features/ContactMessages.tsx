'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Conversa } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowDown, ArrowUp, MessageSquare, Mail, Bot, Phone, Send } from 'lucide-react'
import { toast } from 'sonner'

interface ContactMessagesProps {
  leadId: string
}

export function ContactMessages({ leadId }: ContactMessagesProps) {
  const [messages, setMessages] = useState<Conversa[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [selectedChannel, setSelectedChannel] = useState<string>('chat')
  const [isSending, setIsSending] = useState(false)
  const [leadPhone, setLeadPhone] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchMessages()
    fetchLeadPhone()
  }, [leadId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLeadPhone = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('phone')
        .eq('id', leadId)
        .single()

      if (error) throw error
      setLeadPhone(data?.phone || null)
    } catch (error) {
      console.error('Erro ao buscar telefone do lead:', error)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return

    if (selectedChannel === 'whatsapp' && !leadPhone) {
      toast.error('Telefone do contato não encontrado. Cadastre o telefone primeiro.')
      return
    }

    setIsSending(true)
    try {
      if (selectedChannel === 'whatsapp') {
        const response = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            number: leadPhone,
            text: newMessage.trim(),
            leadId: leadId,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao enviar mensagem')
        }
      } else {
        const { data: { user } } = await supabase.auth.getUser()

        const { error } = await supabase.from('messages').insert({
          lead_id: leadId,
          content: newMessage.trim(),
          direction: 'outbound',
          channel: selectedChannel,
          user_id: user?.id,
        })

        if (error) throw error
      }

      setNewMessage('')
      fetchMessages()
      toast.success('Mensagem enviada!')
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar mensagem')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <Phone className="w-3 h-3 text-green-500" />
      case 'email':
        return <Mail className="w-3 h-3 text-blue-500" />
      case 'n8n':
        return <Bot className="w-3 h-3 text-orange-500" />
      default:
        return <MessageSquare className="w-3 h-3 text-purple-500" />
    }
  }

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'whatsapp': return 'WhatsApp'
      case 'email': return 'Email'
      case 'n8n': return 'n8n'
      default: return 'Chat'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

    if (messageDate.getTime() === today.getTime()) return 'Hoje'
    if (messageDate.getTime() === yesterday.getTime()) return 'Ontem'
    return date.toLocaleDateString('pt-BR')
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const groupMessagesByDate = (msgs: Conversa[]) => {
    const groups: { date: string; messages: Conversa[] }[] = []
    let currentDate = ''

    msgs.forEach((msg) => {
      const msgDate = formatDate(msg.created_at)
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msgDate, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-start">
              <div className="w-48 h-16 bg-gray-200 rounded-2xl animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const groupedMessages = groupMessagesByDate(messages)

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden">
      {/* Messages Area */}
      <div className="h-[400px] overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
            <p>Nenhuma mensagem encontrada</p>
            <p className="text-sm text-gray-400 mt-1">Envie a primeira mensagem abaixo</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-4">
                <span className="px-3 py-1 bg-white rounded-full text-xs text-gray-500 shadow-sm">
                  {group.date}
                </span>
              </div>
              <div className="space-y-3">
                {group.messages.map((msg) => {
                  const isInbound = msg.direction === 'inbound'
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isInbound ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isInbound
                            ? 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                            : 'bg-green-500 text-white rounded-br-sm'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isInbound ? 'justify-start' : 'justify-end'
                          }`}
                        >
                          {isInbound ? (
                            <ArrowDown className="w-3 h-3 text-blue-400" />
                          ) : (
                            <ArrowUp className="w-3 h-3 text-green-300" />
                          )}
                          {getChannelIcon(msg.channel)}
                          <span
                            className={`text-xs ${
                              isInbound ? 'text-gray-500' : 'text-green-100'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <Select value={selectedChannel} onValueChange={setSelectedChannel}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="chat">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-500" />
                  Chat
                </div>
              </SelectItem>
              <SelectItem value="whatsapp">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-500" />
                  WhatsApp
                </div>
              </SelectItem>
              <SelectItem value="email">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-500" />
                  Email
                </div>
              </SelectItem>
              <SelectItem value="n8n">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-orange-500" />
                  n8n
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
            disabled={isSending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
            className="rounded-full h-10 w-10 p-0 bg-green-500 hover:bg-green-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Enviando via <span className="font-medium">{getChannelLabel(selectedChannel)}</span> • Enter para enviar
        </p>
      </div>
    </div>
  )
}
