import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { logActivity } from '../utils/activity.js'

const router = Router()

const orderSchema = z.object({
  customer: z.string().email(),
  total: z.number().int().positive(),
  items: z.number().int().positive(),
  channel: z.string().default('Web').optional(),
  paymentProvider: z.string().default('stripe').optional(),
  stripePaymentIntent: z.string().optional(),
})

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  category: product.category,
  price: product.price,
  originalPrice: product.originalPrice,
  stock: product.stock,
  rating: product.rating,
  reviews: product.reviews,
  image: product.image,
  description: product.description,
  tags: product.tags,
  featured: product.featured,
})

router.get('/bootstrap', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } })
  const settings = await prisma.storeSetting.findFirst()

  return res.json({
    products: products.map(mapProduct),
    storeSettings: settings,
  })
})

router.post('/orders', async (req, res) => {
  const parsed = orderSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de orden invalidos' })
  }

  const currentCount = await prisma.order.count()
  const orderCode = `ORD-${String(currentCount + 1).padStart(3, '0')}`

  const order = await prisma.order.create({
    data: {
      orderCode,
      customerEmail: parsed.data.customer.toLowerCase(),
      total: parsed.data.total,
      items: parsed.data.items,
      channel: parsed.data.channel || 'Web',
      paymentProvider: parsed.data.paymentProvider || 'stripe',
      stripePaymentIntent: parsed.data.stripePaymentIntent,
    },
  })

  await logActivity('order', `Nueva orden ${order.orderCode} creada por ${order.customerEmail}`)

  return res.status(201).json({
    order: {
      id: order.id,
      code: order.orderCode,
      status: order.status,
    },
  })
})

export default router
