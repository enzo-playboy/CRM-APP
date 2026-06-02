import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return NextResponse.json({ error: 'Stripe não configurado' }, { status: 503 })
  }

  const Stripe = (await import('stripe')).default
  const stripe = new Stripe(stripeKey, { apiVersion: '2025-02-24.acacia' })

  const searchParams = request.nextUrl.searchParams
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: 'startDate and endDate are required' },
      { status: 400 }
    )
  }

  try {
    const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
    const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

    // Fetch payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    })

    // Fetch invoices
    const invoices = await stripe.invoices.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    })

    // Fetch subscriptions
    const subscriptions = await stripe.subscriptions.list({
      created: {
        gte: startTimestamp,
        lte: endTimestamp,
      },
      limit: 100,
    })

    // Transform payment intents
    const revenues = [
      ...paymentIntents.data
        .filter(pi => pi.status === 'succeeded')
        .map(pi => ({
          id: pi.id,
          stripe_payment_id: pi.id,
          customer_email: pi.receipt_email || null,
          customer_name: null,
          amount: pi.amount / 100,
          currency: pi.currency.toUpperCase(),
          status: 'succeeded' as const,
          type: 'payment' as const,
          description: pi.description || null,
          created_at: new Date(pi.created * 1000).toISOString(),
        })),
      ...invoices.data.map(inv => ({
        id: inv.id,
        stripe_invoice_id: inv.id,
        customer_email: inv.customer_email || null,
        customer_name: inv.customer_name || null,
        amount: inv.amount_paid / 100,
        currency: inv.currency.toUpperCase(),
        status: inv.status === 'paid' ? 'succeeded' as const : 
                inv.status === 'open' ? 'pending' as const : 'failed' as const,
        type: 'invoice' as const,
        description: inv.description || null,
        created_at: new Date(inv.created * 1000).toISOString(),
      })),
      ...subscriptions.data.map(sub => ({
        id: sub.id,
        stripe_payment_id: sub.latest_invoice as string || null,
        customer_email: null,
        customer_name: null,
        amount: sub.items.data[0]?.price?.unit_amount ? sub.items.data[0].price.unit_amount / 100 : 0,
        currency: sub.items.data[0]?.price?.currency?.toUpperCase() || 'BRL',
        status: sub.status === 'active' ? 'succeeded' as const : 'pending' as const,
        type: 'subscription' as const,
        description: `Assinatura: ${sub.items.data[0]?.price?.nickname || sub.id}`,
        created_at: new Date(sub.created * 1000).toISOString(),
      })),
    ]

    // Sort by date
    revenues.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json(revenues)
  } catch (error) {
    console.error('Stripe API error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar dados do Stripe' },
      { status: 500 }
    )
  }
}
