/**
 * Analytics Routes - API analitica para dashboard de BI
 * 
 * Endpoints para consultar datos del repositorio analitico (DuckDB)
 * y metricas de negocio agregadas.
 */

import { Router } from 'express'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { dataProductPublisher } from '../services/DataProductPublisher.js'
import { orderService } from '../services/OrderService.js'
import { productCatalogService } from '../services/ProductCatalogService.js'
import { prisma } from '../lib/prisma.js'

const router = Router()

/**
 * GET /api/analytics/dashboard
 * Obtiene metricas principales para el dashboard ejecutivo
 */
router.get('/dashboard', requireAuth, requirePermission('dashboard'), async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d'
    
    const [orderStats, catalogStats, analytics, recentActivity] = await Promise.all([
      orderService.getOrderStats(),
      productCatalogService.getCatalogStats(),
      dataProductPublisher.getAnalytics(timeRange),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ])

    return res.json({
      orders: orderStats,
      catalog: catalogStats,
      analytics,
      recentActivity: recentActivity.map(a => ({
        id: a.id,
        type: a.type,
        text: a.text,
        timestamp: a.createdAt,
      })),
      timeRange,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener metricas del dashboard' })
  }
})

/**
 * GET /api/analytics/events
 * Consulta eventos de negocio del repositorio analitico
 */
router.get('/events', requireAuth, requirePermission('dashboard'), async (req, res) => {
  try {
    const filters = {
      eventType: req.query.eventType,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: parseInt(req.query.limit) || 100,
    }

    const events = await dataProductPublisher.queryEvents(filters)
    return res.json({ events })
  } catch (error) {
    return res.status(500).json({ message: 'Error al consultar eventos' })
  }
})

/**
 * GET /api/analytics/conversion-funnel
 * Obtiene datos del embudo de conversion
 */
router.get('/conversion-funnel', requireAuth, requirePermission('dashboard'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Obtener conteos de cada paso del funnel desde ActivityLog
    const [views, carts, checkouts, orders, completed] = await Promise.all([
      prisma.activityLog.count({
        where: { type: 'ProductViewed', createdAt: { gte: startDate } },
      }),
      prisma.activityLog.count({
        where: { type: 'ProductAddedToCart', createdAt: { gte: startDate } },
      }),
      prisma.activityLog.count({
        where: { type: 'CheckoutStarted', createdAt: { gte: startDate } },
      }),
      prisma.activityLog.count({
        where: { type: 'OrderCreated', createdAt: { gte: startDate } },
      }),
      prisma.activityLog.count({
        where: { type: 'OrderCompleted', createdAt: { gte: startDate } },
      }),
    ])

    return res.json({
      funnel: [
        { step: 'Vistas de Producto', count: views, percentage: 100 },
        { step: 'Agregado al Carrito', count: carts, percentage: views ? Math.round(carts / views * 100) : 0 },
        { step: 'Checkout Iniciado', count: checkouts, percentage: views ? Math.round(checkouts / views * 100) : 0 },
        { step: 'Orden Creada', count: orders, percentage: views ? Math.round(orders / views * 100) : 0 },
        { step: 'Orden Completada', count: completed, percentage: views ? Math.round(completed / views * 100) : 0 },
      ],
      days,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener funnel de conversion' })
  }
})

/**
 * GET /api/analytics/top-products
 * Obtiene productos mas vistos vs mas comprados
 */
router.get('/top-products', requireAuth, requirePermission('dashboard'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10

    // Productos mas vendidos (por ordenes)
    const orders = await prisma.order.findMany({
      where: { status: 'completed' },
      orderBy: { total: 'desc' },
      take: limit,
    })

    // Productos destacados
    const featuredProducts = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { reviews: 'desc' },
      take: limit,
    })

    return res.json({
      topByRevenue: orders,
      featured: featuredProducts,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener top productos' })
  }
})

/**
 * GET /api/analytics/orders-by-time
 * Obtiene ordenes agrupadas por hora/dia/semana
 */
router.get('/orders-by-time', requireAuth, requirePermission('dashboard'), async (req, res) => {
  try {
    const groupBy = req.query.groupBy || 'day' // hour, day, week
    const days = parseInt(req.query.days) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const orders = await prisma.order.findMany({
      where: { createdAt: { gte: startDate } },
      select: { createdAt: true, total: true, status: true },
    })

    // Agrupar ordenes por periodo
    const grouped = {}
    orders.forEach(order => {
      let key
      const date = new Date(order.createdAt)
      
      if (groupBy === 'hour') {
        key = `${date.toISOString().slice(0, 13)}:00`
      } else if (groupBy === 'week') {
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        key = weekStart.toISOString().slice(0, 10)
      } else {
        key = date.toISOString().slice(0, 10)
      }

      if (!grouped[key]) {
        grouped[key] = { period: key, count: 0, revenue: 0 }
      }
      grouped[key].count++
      if (order.status === 'completed') {
        grouped[key].revenue += order.total
      }
    })

    return res.json({
      data: Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period)),
      groupBy,
      days,
    })
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener ordenes por tiempo' })
  }
})

export default router
