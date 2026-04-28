/**
 * PaymentGatewayService - Patron Adapter para procesamiento de pagos
 * 
 * ADR-003: Independencia del proveedor de pagos
 * 
 * Este servicio implementa el patron Adapter, permitiendo que el OrderService
 * no conozca los detalles de implementacion del proveedor de pagos.
 * 
 * Beneficios:
 * - Si Stripe cambia su API, solo se modifica el StripeAdapter
 * - Facilita migracion a otro proveedor (PayU, MercadoPago, etc.)
 * - La logica de negocio permanece intacta
 * - Testing mas sencillo con mock adapters
 */

import Stripe from 'stripe'
import { prisma } from '../lib/prisma.js'

/**
 * Interfaz abstracta para adaptadores de pago
 */
class PaymentAdapter {
  async createPaymentIntent(amount, currency, metadata) {
    throw new Error('createPaymentIntent debe ser implementado')
  }

  async confirmPayment(paymentIntentId) {
    throw new Error('confirmPayment debe ser implementado')
  }

  async refundPayment(paymentIntentId, amount) {
    throw new Error('refundPayment debe ser implementado')
  }

  async getPaymentStatus(paymentIntentId) {
    throw new Error('getPaymentStatus debe ser implementado')
  }
}

/**
 * StripeAdapter - Implementacion concreta para Stripe
 */
class StripeAdapter extends PaymentAdapter {
  constructor() {
    super()
    this.stripe = null
  }

  initialize() {
    if (!this.stripe && process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    }
    return !!this.stripe
  }

  async createPaymentIntent(amount, currency, metadata = {}) {
    if (!this.initialize()) {
      throw new Error('STRIPE_SECRET_KEY no configurado')
    }

    const intent = await this.stripe.paymentIntents.create({
      amount,
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
    })

    // Registrar en base de datos
    await prisma.stripePayment.create({
      data: {
        paymentIntentId: intent.id,
        orderCode: metadata.orderCode,
        amount,
        currency: intent.currency,
        status: intent.status,
      },
    })

    return {
      paymentIntentId: intent.id,
      clientSecret: intent.client_secret,
      status: intent.status,
    }
  }

  async confirmPayment(paymentIntentId) {
    if (!this.initialize()) {
      throw new Error('STRIPE_SECRET_KEY no configurado')
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId)

    await prisma.stripePayment.update({
      where: { paymentIntentId },
      data: { status: intent.status },
    })

    return {
      paymentIntentId: intent.id,
      status: intent.status,
      confirmed: intent.status === 'succeeded',
    }
  }

  async refundPayment(paymentIntentId, amount = null) {
    if (!this.initialize()) {
      throw new Error('STRIPE_SECRET_KEY no configurado')
    }

    const refundData = { payment_intent: paymentIntentId }
    if (amount) refundData.amount = amount

    const refund = await this.stripe.refunds.create(refundData)

    await prisma.stripePayment.update({
      where: { paymentIntentId },
      data: { status: 'refunded' },
    })

    return {
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount,
    }
  }

  async getPaymentStatus(paymentIntentId) {
    if (!this.initialize()) {
      throw new Error('STRIPE_SECRET_KEY no configurado')
    }

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      paymentIntentId: intent.id,
      status: intent.status,
      amount: intent.amount,
      currency: intent.currency,
    }
  }
}

/**
 * MockAdapter - Para testing y desarrollo sin Stripe
 */
class MockPaymentAdapter extends PaymentAdapter {
  async createPaymentIntent(amount, currency, metadata = {}) {
    const mockIntentId = `pi_mock_${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    return {
      paymentIntentId: mockIntentId,
      clientSecret: `${mockIntentId}_secret_mock`,
      status: 'requires_payment_method',
    }
  }

  async confirmPayment(paymentIntentId) {
    return {
      paymentIntentId,
      status: 'succeeded',
      confirmed: true,
    }
  }

  async refundPayment(paymentIntentId, amount = null) {
    return {
      refundId: `re_mock_${Date.now()}`,
      status: 'succeeded',
      amount,
    }
  }

  async getPaymentStatus(paymentIntentId) {
    return {
      paymentIntentId,
      status: 'succeeded',
      amount: 0,
      currency: 'cop',
    }
  }
}

/**
 * PaymentGatewayService - Fachada que selecciona el adapter apropiado
 */
class PaymentGatewayService {
  constructor() {
    this.adapters = {
      stripe: new StripeAdapter(),
      mock: new MockPaymentAdapter(),
    }
    this.defaultProvider = 'stripe'
  }

  getAdapter(provider) {
    const adapter = this.adapters[provider] || this.adapters[this.defaultProvider]
    return adapter
  }

  /**
   * Procesa un pago usando el adapter configurado
   */
  async processPayment({ amount, currency = 'cop', orderCode, provider = 'stripe' }) {
    const adapter = this.getAdapter(provider)
    
    try {
      return await adapter.createPaymentIntent(amount, currency, { orderCode })
    } catch (error) {
      // Si Stripe falla y no es requerido, usar mock en desarrollo
      if (process.env.NODE_ENV !== 'production' && provider === 'stripe') {
        console.warn('[PaymentGateway] Stripe no disponible, usando mock adapter')
        return this.adapters.mock.createPaymentIntent(amount, currency, { orderCode })
      }
      throw error
    }
  }

  async confirmPayment(paymentIntentId, provider = 'stripe') {
    const adapter = this.getAdapter(provider)
    return adapter.confirmPayment(paymentIntentId)
  }

  async refundPayment(paymentIntentId, amount = null, provider = 'stripe') {
    const adapter = this.getAdapter(provider)
    return adapter.refundPayment(paymentIntentId, amount)
  }

  async getPaymentStatus(paymentIntentId, provider = 'stripe') {
    const adapter = this.getAdapter(provider)
    return adapter.getPaymentStatus(paymentIntentId)
  }

  /**
   * Registra un nuevo adapter de pago
   * Permite extender el sistema con nuevos proveedores (PayU, MercadoPago, etc.)
   */
  registerAdapter(name, adapter) {
    if (!(adapter instanceof PaymentAdapter)) {
      throw new Error('Adapter debe extender PaymentAdapter')
    }
    this.adapters[name] = adapter
  }
}

export const paymentGateway = new PaymentGatewayService()
