/**
 * OrderService - Coordinador del flujo de compra
 * 
 * Responsabilidades:
 * - Validar stock antes de crear orden
 * - Crear ordenes dentro de transacciones ACID
 * - Coordinar con PaymentGateway para procesar pagos
 * - Publicar eventos de dominio via DataProductPublisher
 * - Restaurar stock automaticamente si el pago falla
 */

import { prisma } from '../lib/prisma.js'
import { dataProductPublisher, EventTypes } from './DataProductPublisher.js'
import { paymentGateway } from './PaymentGatewayService.js'

class OrderService {
  /**
   * Crea una nueva orden con garantias ACID
   * @param {object} orderData - Datos de la orden
   * @returns {object} Orden creada
   */
  async createOrder(orderData) {
    const { customerEmail, items, total, channel = 'Web', paymentProvider = 'stripe' } = orderData

    // Generar codigo de orden secuencial
    const currentCount = await prisma.order.count()
    const orderCode = `ORD-${String(currentCount + 1).padStart(4, '0')}`

    // Crear orden en transaccion ACID
    const order = await prisma.$transaction(async (tx) => {
      // Validar stock para cada item (si se proporcionan productos especificos)
      if (orderData.products && orderData.products.length > 0) {
        for (const item of orderData.products) {
          const product = await tx.product.findUnique({ where: { id: item.productId } })
          if (!product) {
            throw new Error(`Producto ${item.productId} no encontrado`)
          }
          if (product.stock < item.quantity) {
            throw new Error(`Stock insuficiente para ${product.name}`)
          }
          
          // Decrementar stock
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          })
        }
      }

      // Crear la orden
      return tx.order.create({
        data: {
          orderCode,
          customerEmail: customerEmail.toLowerCase(),
          total,
          items,
          channel,
          paymentProvider,
          status: 'pending',
        },
      })
    })

    // Publicar evento OrderCreated
    await dataProductPublisher.publish(EventTypes.ORDER_CREATED, {
      orderId: order.id,
      orderCode: order.orderCode,
      customerEmail: order.customerEmail,
      total: order.total,
      items: order.items,
      channel: order.channel,
      paymentProvider: order.paymentProvider,
    })

    return order
  }

  /**
   * Procesa el pago de una orden usando el PaymentGateway
   * @param {string} orderCode - Codigo de la orden
   * @param {object} paymentData - Datos del pago
   */
  async processPayment(orderCode, paymentData) {
    const order = await prisma.order.findUnique({ where: { orderCode } })
    if (!order) {
      throw new Error(`Orden ${orderCode} no encontrada`)
    }

    // Publicar evento de inicio de checkout
    await dataProductPublisher.publish(EventTypes.CHECKOUT_STARTED, {
      orderCode,
      total: order.total,
    })

    try {
      // Procesar pago a traves del adapter
      const paymentResult = await paymentGateway.processPayment({
        amount: order.total,
        currency: 'cop',
        orderCode,
        ...paymentData,
      })

      // Actualizar orden con datos del pago
      await prisma.order.update({
        where: { orderCode },
        data: {
          status: 'processing',
          stripePaymentIntent: paymentResult.paymentIntentId,
        },
      })

      // Publicar evento de pago exitoso
      await dataProductPublisher.publish(EventTypes.PAYMENT_PROCESSED, {
        orderCode,
        paymentIntentId: paymentResult.paymentIntentId,
        provider: order.paymentProvider,
        amount: order.total,
      })

      return paymentResult
    } catch (error) {
      // Publicar evento de pago fallido
      await dataProductPublisher.publish(EventTypes.PAYMENT_FAILED, {
        orderCode,
        reason: error.message,
        provider: order.paymentProvider,
      })

      // Restaurar stock si falla el pago
      await this.restoreStock(order)

      throw error
    }
  }

  /**
   * Completa una orden despues de confirmacion de pago
   * @param {string} orderCode - Codigo de la orden
   */
  async completeOrder(orderCode) {
    const order = await prisma.order.update({
      where: { orderCode },
      data: { status: 'completed' },
    })

    await dataProductPublisher.publish(EventTypes.ORDER_COMPLETED, {
      orderCode,
      total: order.total,
      customerEmail: order.customerEmail,
    })

    // Actualizar metricas del cliente
    await this.updateCustomerMetrics(order.customerEmail, order.total)

    return order
  }

  /**
   * Cancela una orden y restaura el stock
   * @param {string} orderCode - Codigo de la orden
   * @param {string} reason - Razon de la cancelacion
   */
  async cancelOrder(orderCode, reason = 'Cancelado por el usuario') {
    const order = await prisma.order.findUnique({ where: { orderCode } })
    if (!order) {
      throw new Error(`Orden ${orderCode} no encontrada`)
    }

    await prisma.order.update({
      where: { orderCode },
      data: { status: 'canceled' },
    })

    await this.restoreStock(order)

    await dataProductPublisher.publish(EventTypes.ORDER_CANCELED, {
      orderCode,
      reason,
      total: order.total,
    })

    return order
  }

  /**
   * Restaura el stock de productos de una orden
   */
  async restoreStock(order) {
    // Si tenemos los productos especificos, restaurar su stock
    // En caso contrario, el stock se maneja manualmente
    if (order.products) {
      for (const item of order.products) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        })
      }
    }
  }

  /**
   * Actualiza metricas del cliente despues de una compra
   */
  async updateCustomerMetrics(email, orderTotal) {
    const customer = await prisma.customer.findUnique({ where: { email } })
    if (customer) {
      await prisma.customer.update({
        where: { email },
        data: {
          orders: { increment: 1 },
          lifetimeValue: { increment: orderTotal },
        },
      })
    }
  }

  /**
   * Obtiene ordenes con filtros
   */
  async getOrders(filters = {}) {
    const where = {}
    
    if (filters.status) where.status = filters.status
    if (filters.customerEmail) where.customerEmail = filters.customerEmail
    if (filters.startDate) where.createdAt = { gte: new Date(filters.startDate) }

    return prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 50,
    })
  }

  /**
   * Obtiene estadisticas de ordenes para dashboard
   */
  async getOrderStats() {
    const [total, completed, pending, canceled] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'canceled' } }),
    ])

    const revenue = await prisma.order.aggregate({
      where: { status: 'completed' },
      _sum: { total: true },
    })

    return {
      totalOrders: total,
      completedOrders: completed,
      pendingOrders: pending,
      canceledOrders: canceled,
      totalRevenue: revenue._sum.total || 0,
    }
  }
}

export const orderService = new OrderService()
