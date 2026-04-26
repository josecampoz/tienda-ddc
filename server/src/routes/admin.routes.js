import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { CATEGORY_OPTIONS, getCategoryLabel } from '../../../src/data/catalog.js'
import { logActivity, mapActivity } from '../utils/activity.js'

const router = Router()

const PRODUCT_CATEGORIES = CATEGORY_OPTIONS.map((category) => category.id)

const mapProduct = (product) => ({
  id: product.id,
  name: product.name,
  brand: product.brand,
  category: product.category,
  categoryLabel: getCategoryLabel(product.category),
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

const mapOrder = (order) => ({
  id: order.orderCode,
  customer: order.customerEmail,
  total: order.total,
  status: order.status,
  date: order.createdAt.toISOString().slice(0, 10),
  items: order.items,
  channel: order.channel,
})

const mapCustomer = (customer) => ({
  id: customer.id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
  tier: customer.tier,
  status: customer.status,
  lifetimeValue: customer.lifetimeValue,
  orders: customer.orders,
  city: customer.city,
  createdAt: customer.createdAt,
})

const mapCampaign = (campaign) => ({
  id: campaign.id,
  name: campaign.name,
  code: campaign.code,
  discountType: campaign.discountType,
  discountValue: campaign.discountValue,
  status: campaign.status,
  startsAt: campaign.startsAt.toISOString().slice(0, 10),
  endsAt: campaign.endsAt.toISOString().slice(0, 10),
  usageCount: campaign.usageCount,
})

router.use(requireAuth)

router.get('/bootstrap', requirePermission('dashboard'), async (_req, res) => {
  const [products, orders, customers, campaigns, inventoryMovements, activity, storeSettings, stripePayments, shopifySyncLogs] = await Promise.all([
    prisma.product.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.order.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.customer.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.campaign.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.inventoryMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 }),
    prisma.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 30 }),
    prisma.storeSetting.findFirst(),
    prisma.stripePayment.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.shopifySyncLog.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
  ])

  const completedRevenue = orders.filter((order) => order.status === 'completed').reduce((sum, order) => sum + order.total, 0)
  const lowStock = products.filter((product) => product.stock <= 5)

  return res.json({
    products: products.map(mapProduct),
    orders: orders.map(mapOrder),
    customers: customers.map(mapCustomer),
    campaigns: campaigns.map(mapCampaign),
    inventoryMovements: inventoryMovements.map((movement) => ({
      id: movement.id,
      productId: movement.productId,
      productName: movement.productName,
      delta: movement.delta,
      reason: movement.reason,
      actor: movement.actor,
      createdAt: movement.createdAt,
    })),
    activity: activity.map(mapActivity),
    storeSettings,
    stripePayments: stripePayments.map((payment) => ({
      id: payment.id,
      paymentIntentId: payment.paymentIntentId,
      orderCode: payment.orderCode,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.createdAt,
    })),
    shopifySyncLogs: shopifySyncLogs.map((log) => ({
      id: log.id,
      orderCode: log.orderCode,
      status: log.status,
      requestPayload: log.requestPayload,
      responsePayload: log.responsePayload,
      createdAt: log.createdAt,
    })),
    stats: {
      totalRevenue: completedRevenue,
      totalOrders: orders.length,
      activeProducts: products.filter((product) => product.stock > 0).length,
      lowStockCount: lowStock.length,
      outOfStockCount: products.filter((product) => product.stock <= 0).length,
      pendingOrders: orders.filter((order) => order.status === 'pending').length,
      processingOrders: orders.filter((order) => order.status === 'processing').length,
      activeCustomers: customers.filter((customer) => customer.status !== 'inactive').length,
      vipCustomers: customers.filter((customer) => customer.status === 'vip').length,
      activeCampaigns: campaigns.filter((campaign) => campaign.status === 'active').length,
    },
  })
})

router.post('/products', requirePermission('products'), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    brand: z.string().min(2),
    category: z.enum(PRODUCT_CATEGORIES),
    price: z.number().int().positive(),
    stock: z.number().int().min(0),
    image: z.string().url(),
    description: z.string().min(10),
    tags: z.array(z.string()).default([]).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de producto invalidos' })
  }

  const product = await prisma.product.create({
    data: {
      ...parsed.data,
      tags: parsed.data.tags || [],
      featured: false,
      rating: 4.5,
      reviews: 0,
    },
  })

  await logActivity('catalog', `SKU ${product.id} creado por ${req.user.fullName}`)
  return res.status(201).json({ product: mapProduct(product) })
})

router.patch('/products/:id', requirePermission('products'), async (req, res) => {
  const schema = z.object({
    price: z.number().int().positive().optional(),
    stock: z.number().int().min(0).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos invalidos para actualizar producto' })
  }

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  await logActivity('catalog', `Producto ${product.id} actualizado (precio/stock)`)
  return res.json({ product: mapProduct(product) })
})

router.post('/inventory/adjust', requirePermission('products'), async (req, res) => {
  const schema = z.object({
    productId: z.string().min(1),
    delta: z.number().int().refine((value) => value !== 0),
    reason: z.string().min(2),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos invalidos para ajuste de inventario' })
  }

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } })
  if (!product) return res.status(404).json({ message: 'Producto no encontrado' })

  const updatedProduct = await prisma.product.update({
    where: { id: product.id },
    data: { stock: Math.max(0, product.stock + parsed.data.delta) },
  })

  const movement = await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      productName: product.name,
      delta: parsed.data.delta,
      reason: parsed.data.reason,
      actor: req.user.fullName,
    },
  })

  await logActivity('catalog', `Inventario ajustado para ${product.id} (${parsed.data.delta})`)

  return res.json({
    product: mapProduct(updatedProduct),
    movement,
  })
})

router.patch('/orders/:orderCode/status', requirePermission('orders'), async (req, res) => {
  const schema = z.object({
    status: z.enum(['pending', 'processing', 'completed', 'canceled']),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Estado de orden invalido' })
  }

  const order = await prisma.order.update({
    where: { orderCode: req.params.orderCode },
    data: { status: parsed.data.status },
  })

  await logActivity('order', `Orden ${order.orderCode} cambio a estado ${order.status}`)
  return res.json({ order: mapOrder(order) })
})

router.post('/customers', requirePermission('customers'), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(5),
    city: z.string().min(2),
    tier: z.string().default('Silver').optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de cliente invalidos' })
  }

  const customer = await prisma.customer.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone,
      city: parsed.data.city,
      tier: parsed.data.tier || 'Silver',
      status: parsed.data.tier === 'Platinum' ? 'vip' : 'active',
    },
  })

  await logActivity('crm', `Cliente ${customer.email} creado en CRM`)
  return res.status(201).json({ customer: mapCustomer(customer) })
})

router.patch('/customers/:id', requirePermission('customers'), async (req, res) => {
  const schema = z.object({
    tier: z.string().optional(),
    status: z.string().optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos invalidos para cliente' })
  }

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  await logActivity('crm', `Cliente ${customer.email} actualizado`)
  return res.json({ customer: mapCustomer(customer) })
})

router.post('/campaigns', requirePermission('campaigns'), async (req, res) => {
  const schema = z.object({
    name: z.string().min(2),
    code: z.string().min(3),
    discountType: z.enum(['percent', 'fixed']),
    discountValue: z.number().int().positive(),
    startsAt: z.string(),
    endsAt: z.string(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de campaña invalidos' })
  }

  const campaign = await prisma.campaign.create({
    data: {
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      discountType: parsed.data.discountType,
      discountValue: parsed.data.discountValue,
      startsAt: new Date(parsed.data.startsAt),
      endsAt: new Date(parsed.data.endsAt),
      status: 'draft',
    },
  })

  await logActivity('marketing', `Campaña ${campaign.code} creada en estado borrador`)
  return res.status(201).json({ campaign: mapCampaign(campaign) })
})

router.patch('/campaigns/:id', requirePermission('campaigns'), async (req, res) => {
  const schema = z.object({
    status: z.enum(['draft', 'active', 'paused', 'ended']).optional(),
    usageCount: z.number().int().min(0).optional(),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos invalidos para campaña' })
  }

  const campaign = await prisma.campaign.update({
    where: { id: req.params.id },
    data: parsed.data,
  })

  await logActivity('marketing', `Campaña ${campaign.code} actualizada a estado ${campaign.status}`)
  return res.json({ campaign: mapCampaign(campaign) })
})

router.patch('/settings', requirePermission('settings'), async (req, res) => {
  const schema = z.object({
    storeName: z.string().min(2),
    supportEmail: z.string().email(),
    supportPhone: z.string().min(6),
    taxRate: z.number().int().min(0).max(100),
    freeShippingThreshold: z.number().int().min(0),
    currency: z.string().min(2),
    timezone: z.string().min(2),
  })

  const parsed = schema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Configuracion invalida' })
  }

  const existing = await prisma.storeSetting.findFirst()
  const settings = existing
    ? await prisma.storeSetting.update({ where: { id: existing.id }, data: parsed.data })
    : await prisma.storeSetting.create({ data: parsed.data })

  await logActivity('settings', 'Configuracion de tienda actualizada')
  return res.json({ storeSettings: settings })
})

export default router
