# ADR-003: Patrón Adapter para Integración de Pagos

## Estado
Aceptado

## Contexto
El sistema necesita procesar pagos con tarjeta de crédito. Stripe es el proveedor inicial elegido por:
- Excelente documentación y SDK
- Amplia adopción en el mercado
- Soporte para Colombia (COP)

Sin embargo, el negocio no debe estar estructuralmente atado a un único proveedor de pagos.

## Decision
Implementar el **patrón Adapter** a través de un `PaymentGatewayService` que abstrae la comunicación con proveedores de pago.

## Justificacion

### Independencia del Proveedor
```
                    ┌─────────────────┐
                    │  OrderService   │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │PaymentGateway   │  ← Interfaz abstracta
                    │    Service      │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │  Stripe  │  │  PayU    │  │  Mock    │
        │ Adapter  │  │ Adapter  │  │ Adapter  │
        └──────────┘  └──────────┘  └──────────┘
```

El `OrderService` no sabe (ni necesita saber) si está comunicándose con Stripe, PayU, MercadoPago o cualquier otro proveedor.

### Escenarios de Cambio
1. **Stripe cambia su API**: Solo se modifica `StripeAdapter`
2. **Migración a PayU**: Se implementa `PayUAdapter`, se cambia configuración
3. **Multi-proveedor**: Se pueden usar diferentes adapters según región o monto
4. **Testing**: `MockAdapter` permite tests sin llamadas reales

### Principios SOLID
- **S**: Cada adapter tiene una sola responsabilidad
- **O**: Abierto a extensión (nuevos adapters), cerrado a modificación
- **L**: Todos los adapters son intercambiables
- **I**: Interfaz mínima (createPaymentIntent, confirmPayment, refund)
- **D**: OrderService depende de abstracción, no de Stripe directamente

## Implementacion

```javascript
// PaymentGatewayService.js
class PaymentGatewayService {
  constructor() {
    this.adapters = {
      stripe: new StripeAdapter(),
      payu: new PayUAdapter(),
      mock: new MockPaymentAdapter(),
    }
  }

  async processPayment({ amount, currency, orderCode, provider = 'stripe' }) {
    const adapter = this.adapters[provider]
    return adapter.createPaymentIntent(amount, currency, { orderCode })
  }
}

// OrderService.js (no conoce Stripe)
class OrderService {
  async processPayment(orderCode, paymentData) {
    const result = await paymentGateway.processPayment({
      amount: order.total,
      orderCode,
      ...paymentData,
    })
    // ...
  }
}
```

## Consecuencias

### Positivas
- Cambio de proveedor sin modificar lógica de negocio
- Testing simplificado con mocks
- Posibilidad de multi-proveedor futuro
- Código más mantenible y testeable

### Negativas
- Capa de abstracción adicional
- Features específicos de Stripe requieren bypass del adapter
- Overhead inicial de diseño

### Mitigacion
Para features específicos de Stripe (como Stripe Connect o Stripe Billing), se pueden exponer métodos específicos en el adapter sin romper la abstracción general.

## Alternativas Consideradas
- **Llamada directa a Stripe SDK**: Rechazado por acoplamiento
- **Strategy Pattern**: Similar, pero Adapter es más apropiado para integración externa
- **Facade Pattern**: Considerado, pero Adapter expresa mejor la traducción de interfaces

## Referencias
- Gang of Four: "Design Patterns" - Adapter Pattern
- Stripe API Documentation
- Martin Fowler: "Patterns of Enterprise Application Architecture"
