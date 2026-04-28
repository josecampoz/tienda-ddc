/**
 * Store Routes - API publica de la tienda
 * 
 * Endpoints para el frontend de e-commerce:
 * - Bootstrap (productos + configuracion)
 * - Crear ordenes
 * - Registrar eventos de productos (vistas, carrito)
 */

import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { orderService } from '../services/OrderService.js'
import { productCatalogService } from '../services/ProductCatalogService.js'
import { dataProductPublisher, EventTypes } from '../services/DataProductPublisher.js'

const router = Router()

// Schemas de validacion
const orderSchema = z.object({
  customer: z.string().email(),
  total: z.number().int().positive(),
  items: z.number().int().positive(),
  channel: z.string().default('Web').optional(),
  paymentProvider: z.string().default('stripe').optional(),
  stripePaymentIntent: z.string().optional(),
})

const productViewSchema = z.object({
  productId: z.string(),
  userEmail: z.string().email().optional(),
  sessionId: z.string().optional(),
})

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive().default(1),
  userEmail: z.string().email().optional(),
  sessionId: z.string().optional(),
})

/**
 * GET /api/store/bootstrap
 * Obtiene productos y configuracion inicial de la tienda
 */
router.get('/bootstrap', async (_req, res) => {
  try {
    const [products, settings] = await Promise.all([
      productCatalogService.getProducts(),
      prisma.storeSetting.findFirst(),
    ])

    return res.json({
      products,
      storeSettings: settings || {
        storeName: 'Tienda DDC',
        currency: 'COP',
        taxRate: 19,
        freeShippingThreshold: 500000,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al cargar datos de la tienda' })
  }
})

/**
 * GET /api/store/products
 * Obtiene lista de productos con filtros opcionales
 */
router.get('/products', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      brand: req.query.brand,
      featured: req.query.featured === 'true',
      inStock: req.query.inStock === 'true',
    }

    const products = await productCatalogService.getProducts(filters)
    return res.json({ products })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener productos' })
  }
})

/**
 * GET /api/store/products/:id
 * Obtiene un producto por ID
 */
router.get('/products/:id', async (req, res) => {
  try {
    const product = await productCatalogService.getProductById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' })
    }
    return res.json({ product })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener producto' })
  }
})

/**
 * POST /api/store/products/:id/view
 * Registra visualizacion de un producto (evento analitico)
 */
router.post('/products/:id/view', async (req, res) => {
  try {
    const parsed = productViewSchema.safeParse({ productId: req.params.id, ...req.body })
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos' })
    }

    await productCatalogService.recordProductView(
      parsed.data.productId,
      parsed.data.userEmail,
      parsed.data.sessionId
    )

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar vista' })
  }
})

/**
 * POST /api/store/cart/add
 * Registra cuando un producto se agrega al carrito (evento analitico)
 */
router.post('/cart/add', async (req, res) => {
  try {
    const parsed = addToCartSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos invalidos' })
    }

    await productCatalogService.recordAddToCart(
      parsed.data.productId,
      parsed.data.quantity,
      parsed.data.userEmail,
      parsed.data.sessionId
    )

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar carrito' })
  }
})

/**
 * POST /api/store/cart/abandon
 * Registra abandono de carrito (evento analitico)
 */
router.post('/cart/abandon', async (req, res) => {
  try {
    const { items, total, userEmail, sessionId } = req.body

    await dataProductPublisher.publish(EventTypes.CART_ABANDONED, {
      items,
      total,
      userEmail,
    }, { sessionId })

    return res.json({ ok: true })
  } catch (error) {
    return res.status(500).json({ message: 'Error al registrar abandono' })
  }
})

/**
 * POST /api/store/orders
 * Crea una nueva orden
 */
router.post('/orders', async (req, res) => {
  try {
    const parsed = orderSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Datos de orden invalidos', errors: parsed.error.errors })
    }

    const order = await orderService.createOrder({
      customerEmail: parsed.data.customer,
      total: parsed.data.total,
      items: parsed.data.items,
      channel: parsed.data.channel,
      paymentProvider: parsed.data.paymentProvider,
    })

    return res.status(201).json({
      order: {
        id: order.id,
        code: order.orderCode,
        status: order.status,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Error al crear orden' })
  }
})

/**
 * GET /api/store/orders/:code
 * Obtiene estado de una orden
 */
router.get('/orders/:code', async (req, res) => {
  try {
    const order = await prisma.order.findUnique({
      where: { orderCode: req.params.code },
    })

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' })
    }

    return res.json({
      order: {
        id: order.id,
        code: order.orderCode,
        status: order.status,
        total: order.total,
        items: order.items,
        createdAt: order.createdAt,
      },
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener orden' })
  }
})

export default router
