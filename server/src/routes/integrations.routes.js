import { Router } from 'express'
import Stripe from 'stripe'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { logActivity } from '../utils/activity.js'

const router = Router()

router.post('/stripe/payment-intent', async (req, res) => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    return res.status(501).json({ message: 'STRIPE_SECRET_KEY no configurado' })
  }

  const schema = z.object({
    amount: z.number().int().positive(),
    currency: z.string().min(3).default('cop').optional(),
    orderCode: z.string().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos invalidos para PaymentIntent' })
  }

  const stripe = new Stripe(key)
  const intent = await stripe.paymentIntents.create({
    amount: parsed.data.amount,
    currency: (parsed.data.currency || 'cop').toLowerCase(),
    automatic_payment_methods: { enabled: true },
    metadata: {
      orderCode: parsed.data.orderCode || '',
    },
  })

  await prisma.stripePayment.create({
    data: {
      paymentIntentId: intent.id,
      orderCode: parsed.data.orderCode,
      amount: parsed.data.amount,
      currency: intent.currency,
      status: intent.status,
    },
  })

  return res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id })
})

router.post('/shopify/orders/:orderCode/push', requireAuth, requirePermission('orders'), async (req, res) => {
  const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_TOKEN
  const apiVersion = process.env.SHOPIFY_API_VERSION || '2024-10'

  if (!storeDomain || !token) {
    return res.status(501).json({ message: 'Credenciales de Shopify no configuradas' })
  }

  const order = await prisma.order.findUnique({ where: { orderCode: req.params.orderCode } })
  if (!order) {
    return res.status(404).json({ message: 'Orden no encontrada' })
  }

  const shopifyPayload = {
    order: {
      email: order.customerEmail,
      financial_status: 'paid',
      line_items: [{
        title: `Order ${order.orderCode}`,
        quantity: order.items,
        price: (order.total / Math.max(order.items, 1) / 100).toFixed(2),
      }],
      total_price: (order.total / 100).toFixed(2),
      note: `Synced from Tienda DDC, channel: ${order.channel}`,
    },
  }

  const response = await fetch(`https://${storeDomain}/admin/api/${apiVersion}/orders.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token,
    },
    body: JSON.stringify(shopifyPayload),
  })

  const responseBody = await response.text()

  await prisma.shopifySyncLog.create({
    data: {
      orderCode: order.orderCode,
      status: response.ok ? 'success' : 'error',
      requestPayload: JSON.stringify(shopifyPayload),
      responsePayload: responseBody,
    },
  })

  if (!response.ok) {
    await prisma.order.update({
      where: { orderCode: order.orderCode },
      data: { shopifySyncStatus: 'error' },
    })
    return res.status(502).json({ message: 'Error sincronizando orden con Shopify', detail: responseBody })
  }

  const parsedResponse = JSON.parse(responseBody)

  await prisma.order.update({
    where: { orderCode: order.orderCode },
    data: {
      shopifySyncStatus: 'synced',
      shopifyOrderId: String(parsedResponse?.order?.id || ''),
    },
  })

  await logActivity('integrations', `Orden ${order.orderCode} sincronizada con Shopify`)

  return res.json({ ok: true, shopifyOrderId: parsedResponse?.order?.id })
})

export default router
