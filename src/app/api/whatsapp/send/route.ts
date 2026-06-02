import { NextRequest, NextResponse } from 'next/server'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL?.trim()
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY?.trim()
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE?.trim()

interface SendWhatsAppRequest {
  number: string
  text: string
  leadId: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendWhatsAppRequest = await request.json()
    const { number, text, leadId } = body

    if (!number || !text || !leadId) {
      return NextResponse.json(
        { error: 'number, text e leadId são obrigatórios' },
        { status: 400 }
      )
    }

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE) {
      return NextResponse.json(
        { error: 'Configuração da Evolution API não encontrada' },
        { status: 500 }
      )
    }

    let formattedNumber = number.replace(/\D/g, '')
    
    // Adicionar código do país 55 se não tiver
    if (formattedNumber.length === 11 && formattedNumber.startsWith('0')) {
      formattedNumber = '55' + formattedNumber.slice(1)
    } else if (formattedNumber.length === 11) {
      formattedNumber = '55' + formattedNumber
    } else if (formattedNumber.length === 10) {
      formattedNumber = '550' + formattedNumber
    }
    
    if (formattedNumber.length < 12) {
      return NextResponse.json(
        { error: 'Número de telefone inválido. Use formato: 5511999999999' },
        { status: 400 }
      )
    }

    const evolutionResponse = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: formattedNumber,
          text: text,
        }),
      }
    )

    const evolutionData = await evolutionResponse.json()

    if (!evolutionResponse.ok) {
      console.error('Evolution API error:', evolutionData)
      return NextResponse.json(
        { error: 'Erro ao enviar mensagem via Evolution API', details: evolutionData },
        { status: evolutionResponse.status }
      )
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey)
      const { data: { user } } = await supabase.auth.getUser()

      await supabase.from('messages').insert({
        lead_id: leadId,
        content: text,
        direction: 'outbound',
        channel: 'whatsapp',
        user_id: user?.id,
      })
    }

    return NextResponse.json({
      success: true,
      evolution: evolutionData,
    })

  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json(
      { error: 'Erro interno ao enviar mensagem' },
      { status: 500 }
    )
  }
}
