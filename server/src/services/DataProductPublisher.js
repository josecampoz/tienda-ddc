/**
 * DataProductPublisher - Componente central de la Arquitectura Centrada en Datos
 * 
 * Responsabilidad: Transformar eventos de dominio en registros inmutables,
 * estructurados y persistentes para analisis de negocio.
 * 
 * Cada evento capturado es un "data product" - dato de negocio curado,
 * consultable y analiticamente valioso.
 */

import { prisma } from '../lib/prisma.js'
import { duckdb, initDuckDB } from '../lib/duckdb.js'

// Tipos de eventos de dominio soportados
export const EventTypes = {
  PRODUCT_VIEWED: 'ProductViewed',
  PRODUCT_ADDED_TO_CART: 'ProductAddedToCart',
  CART_ABANDONED: 'CartAbandoned',
  CHECKOUT_STARTED: 'CheckoutStarted',
  ORDER_CREATED: 'OrderCreated',
  PAYMENT_PROCESSED: 'PaymentProcessed',
  PAYMENT_FAILED: 'PaymentFailed',
  ORDER_COMPLETED: 'OrderCompleted',
  ORDER_CANCELED: 'OrderCanceled',
  USER_REGISTERED: 'UserRegistered',
  USER_LOGIN: 'UserLogin',
  INVENTORY_UPDATED: 'InventoryUpdated',
  CAMPAIGN_APPLIED: 'CampaignApplied',
}

class DataProductPublisher {
  constructor() {
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return
    await initDuckDB()
    this.initialized = true
  }

  /**
   * Publica un evento de dominio al repositorio analitico (DuckDB)
   * y opcionalmente al log de actividad (PostgreSQL)
   * 
   * @param {string} eventType - Tipo de evento (ver EventTypes)
   * @param {object} payload - Datos del evento
   * @param {object} metadata - Metadata adicional (usuario, sesion, etc)
   */
  async publish(eventType, payload, metadata = {}) {
    await this.initialize()

    const event = {
      id: crypto.randomUUID(),
      eventType,
      payload: JSON.stringify(payload),
      metadata: JSON.stringify(metadata),
      timestamp: new Date().toISOString(),
      source: 'tienda-ddc',
      version: '1.0',
    }

    // Persistir en DuckDB (plano analitico)
    try {
      const db = duckdb.getConnection()
      await db.run(`
        INSERT INTO business_events (id, event_type, payload, metadata, timestamp, source, version)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [event.id, event.eventType, event.payload, event.metadata, event.timestamp, event.source, event.version])
    } catch (error) {
      // DuckDB puede no estar disponible en todos los entornos
      // Fallback a console para desarrollo
      console.warn('[DataProductPublisher] DuckDB no disponible, evento registrado en log')
    }

    // Tambien registrar en ActivityLog de PostgreSQL para trazabilidad
    await prisma.activityLog.create({
      data: {
        type: eventType,
        text: this.formatEventText(eventType, payload),
      },
    })

    return event
  }

  /**
   * Formatea el texto del evento para el log de actividad
   */
  formatEventText(eventType, payload) {
    switch (eventType) {
      case EventTypes.PRODUCT_VIEWED:
        return `Producto "${payload.productName}" visto por ${payload.userEmail || 'visitante anonimo'}`
      case EventTypes.PRODUCT_ADDED_TO_CART:
        return `Producto "${payload.productName}" agregado al carrito (qty: ${payload.quantity})`
      case EventTypes.ORDER_CREATED:
        return `Orden ${payload.orderCode} creada por ${payload.customerEmail} - Total: $${(payload.total / 100).toLocaleString()}`
      case EventTypes.PAYMENT_PROCESSED:
        return `Pago procesado para orden ${payload.orderCode} via ${payload.provider}`
      case EventTypes.PAYMENT_FAILED:
        return `Pago fallido para orden ${payload.orderCode}: ${payload.reason}`
      case EventTypes.ORDER_COMPLETED:
        return `Orden ${payload.orderCode} completada exitosamente`
      case EventTypes.ORDER_CANCELED:
        return `Orden ${payload.orderCode} cancelada: ${payload.reason}`
      case EventTypes.INVENTORY_UPDATED:
        return `Inventario actualizado: ${payload.productName} (${payload.delta > 0 ? '+' : ''}${payload.delta})`
      case EventTypes.CAMPAIGN_APPLIED:
        return `Campaña "${payload.campaignName}" aplicada - Descuento: ${payload.discountValue}`
      case EventTypes.USER_LOGIN:
        return `Usuario ${payload.email} inicio sesion`
      default:
        return `Evento ${eventType}: ${JSON.stringify(payload).slice(0, 100)}`
    }
  }

  /**
   * Consulta eventos del repositorio analitico
   * @param {object} filters - Filtros de consulta
   */
  async queryEvents(filters = {}) {
    await this.initialize()

    let query = 'SELECT * FROM business_events WHERE 1=1'
    const params = []

    if (filters.eventType) {
      query += ' AND event_type = ?'
      params.push(filters.eventType)
    }

    if (filters.startDate) {
      query += ' AND timestamp >= ?'
      params.push(filters.startDate)
    }

    if (filters.endDate) {
      query += ' AND timestamp <= ?'
      params.push(filters.endDate)
    }

    query += ' ORDER BY timestamp DESC'

    if (filters.limit) {
      query += ` LIMIT ${parseInt(filters.limit)}`
    }

    try {
      const db = duckdb.getConnection()
      const result = await db.all(query, params)
      return result.map(row => ({
        ...row,
        payload: JSON.parse(row.payload),
        metadata: JSON.parse(row.metadata),
      }))
    } catch {
      // Fallback a PostgreSQL si DuckDB no esta disponible
      const activities = await prisma.activityLog.findMany({
        where: filters.eventType ? { type: filters.eventType } : undefined,
        orderBy: { createdAt: 'desc' },
        take: filters.limit || 100,
      })
      return activities
    }
  }

  /**
   * Obtiene metricas agregadas para dashboard analitico
   */
  async getAnalytics(timeRange = '7d') {
    await this.initialize()

    const days = timeRange === '30d' ? 30 : timeRange === '24h' ? 1 : 7
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    try {
      const db = duckdb.getConnection()
      
      // Metricas de eventos por tipo
      const eventsByType = await db.all(`
        SELECT event_type, COUNT(*) as count
        FROM business_events
        WHERE timestamp >= ?
        GROUP BY event_type
        ORDER BY count DESC
      `, [startDate.toISOString()])

      // Conversion funnel
      const funnel = await db.all(`
        SELECT 
          event_type,
          COUNT(*) as count
        FROM business_events
        WHERE timestamp >= ?
          AND event_type IN ('ProductViewed', 'ProductAddedToCart', 'CheckoutStarted', 'OrderCreated', 'OrderCompleted')
        GROUP BY event_type
      `, [startDate.toISOString()])

      // Eventos por hora (para graficos)
      const eventsByHour = await db.all(`
        SELECT 
          strftime(timestamp, '%Y-%m-%d %H:00') as hour,
          COUNT(*) as count
        FROM business_events
        WHERE timestamp >= ?
        GROUP BY hour
        ORDER BY hour
      `, [startDate.toISOString()])

      return {
        eventsByType,
        funnel,
        eventsByHour,
        timeRange,
      }
    } catch {
      // Fallback a PostgreSQL
      const activities = await prisma.activityLog.groupBy({
        by: ['type'],
        _count: { id: true },
        where: { createdAt: { gte: startDate } },
      })

      return {
        eventsByType: activities.map(a => ({ event_type: a.type, count: a._count.id })),
        funnel: [],
        eventsByHour: [],
        timeRange,
      }
    }
  }
}

// Singleton para usar en toda la aplicacion
export const dataProductPublisher = new DataProductPublisher()
