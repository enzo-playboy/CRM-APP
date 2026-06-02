'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UnreadCounts {
  [leadId: string]: number
}

interface LastViewedMap {
  [leadId: string]: string
}

export function useUnreadMessages() {
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({})
  const [lastViewed, setLastViewed] = useState<LastViewedMap>({})

  useEffect(() => {
    loadLastViewed()
    fetchUnreadCounts()
  }, [])

  const loadLastViewed = () => {
    try {
      const stored = localStorage.getItem('crm_last_viewed_messages')
      if (stored) {
        setLastViewed(JSON.parse(stored) as LastViewedMap)
      }
    } catch (error) {
      console.error('Erro ao carregar última visualização:', error)
    }
  }

  const fetchUnreadCounts = async () => {
    try {
      const { data: messages, error } = await supabase
        .from('messages')
        .select('lead_id, created_at')
        .eq('direction', 'inbound')
        .order('created_at', { ascending: false })

      if (error) throw error

      const stored = localStorage.getItem('crm_last_viewed_messages')
      const lastViewedMap: LastViewedMap = stored ? JSON.parse(stored) : {}

      const counts: UnreadCounts = {}
      
      messages?.forEach((msg) => {
        const leadId = msg.lead_id
        const lastViewedAt = lastViewedMap[leadId]
        
        if (!lastViewedAt || new Date(msg.created_at) > new Date(lastViewedAt)) {
          counts[leadId] = (counts[leadId] || 0) + 1
        }
      })

      setUnreadCounts(counts)
    } catch (error) {
      console.error('Erro ao buscar mensagens não lidas:', error)
    }
  }

  const markAsRead = useCallback((leadId: string) => {
    const now = new Date().toISOString()
    const stored = localStorage.getItem('crm_last_viewed_messages')
    const lastViewedMap: LastViewedMap = stored ? JSON.parse(stored) : {}
    
    lastViewedMap[leadId] = now
    localStorage.setItem('crm_last_viewed_messages', JSON.stringify(lastViewedMap))
    
    setLastViewed(lastViewedMap)
    setUnreadCounts((prev) => {
      const updated = { ...prev }
      delete updated[leadId]
      return updated
    })
  }, [])

  const getTotalUnread = useCallback(() => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0)
  }, [unreadCounts])

  return {
    unreadCounts,
    markAsRead,
    getTotalUnread,
    refresh: fetchUnreadCounts,
  }
}
