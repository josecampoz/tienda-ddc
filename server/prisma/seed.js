import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { PRODUCTS } from '../../src/data/catalog.js'

const prisma = new PrismaClient()

async function main() {
  await prisma.shopifySyncLog.deleteMany()
  await prisma.stripePayment.deleteMany()
  await prisma.inventoryMovement.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.order.deleteMany()
  await prisma.product.deleteMany()
  await prisma.user.deleteMany()
  await prisma.storeSetting.deleteMany()

  const users = [
    { fullName: 'Jose Campo', email: 'root@tiendaddc.com', role: 'super_admin', department: 'Direccion', avatar: 'JC', password: 'Admin123!' },
    { fullName: 'Ana Garcia', email: 'operaciones@tiendaddc.com', role: 'operations_manager', department: 'Operaciones', avatar: 'AG', password: 'Manager123!' },
    { fullName: 'Carlos Mena', email: 'catalogo@tiendaddc.com', role: 'catalog_manager', department: 'Comercial', avatar: 'CM', password: 'Catalogo123!' },
    { fullName: 'Laura Perez', email: 'analitica@tiendaddc.com', role: 'analyst', department: 'BI', avatar: 'LP', password: 'Analyst123!' },
    { fullName: 'Sofia Torres', email: 'soporte@tiendaddc.com', role: 'support', department: 'Atencion al cliente', avatar: 'ST', password: 'Support123!' },
  ]

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10)
    await prisma.user.create({
      data: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        passwordHash,
      },
    })
  }

  const storeSettings = await prisma.storeSetting.create({
    data: {
      storeName: 'TiendaOnline DDC',
      supportEmail: 'soporte@tiendaddc.com',
      supportPhone: '+57 602 000 0000',
      taxRate: 19,
      freeShippingThreshold: 500000,
      currency: 'COP',
      timezone: 'America/Bogota',
    },
  })

  const seededProducts = await prisma.product.createMany({ data: PRODUCTS })

  const productsByCategory = PRODUCTS.reduce((acc, product) => {
    acc[product.category] = (acc[product.category] || 0) + 1
    return acc
  }, {})

  await prisma.order.createMany({
    data: [
      { orderCode: 'ORD-001', customerEmail: 'cliente@ejemplo.com', total: 869000, status: 'completed', items: 2, channel: 'Web' },
      { orderCode: 'ORD-002', customerEmail: 'ana.garcia@gmail.com', total: 5200000, status: 'completed', items: 1, channel: 'Web' },
      { orderCode: 'ORD-003', customerEmail: 'carlos.m@hotmail.com', total: 1410000, status: 'processing', items: 3, channel: 'Marketplace' },
      { orderCode: 'ORD-004', customerEmail: 'sofia.rojas@outlook.com', total: 760000, status: 'pending', items: 2, channel: 'Mobile' },
    ],
  })

  await prisma.customer.createMany({
    data: [
      { name: 'Andrea Lopez', email: 'andrea.lopez@gmail.com', phone: '+57 311 000 1122', tier: 'Gold', status: 'active', lifetimeValue: 4250000, orders: 7, city: 'Bogota' },
      { name: 'Sofia Rojas', email: 'sofia.rojas@outlook.com', phone: '+57 300 991 5501', tier: 'Platinum', status: 'vip', lifetimeValue: 7320000, orders: 12, city: 'Cali' },
      { name: 'Daniel Ruiz', email: 'daniel.ruiz@gmail.com', phone: '+57 320 555 8841', tier: 'Silver', status: 'active', lifetimeValue: 980000, orders: 2, city: 'Medellin' },
    ],
  })

  await prisma.campaign.createMany({
    data: [
      { name: 'Hot Sale Abril', code: 'HOTDDC10', discountType: 'percent', discountValue: 10, status: 'active', startsAt: new Date('2026-04-20'), endsAt: new Date('2026-05-05'), usageCount: 21 },
      { name: 'Tech Days Premium', code: 'TECH200K', discountType: 'fixed', discountValue: 200000, status: 'draft', startsAt: new Date('2026-05-10'), endsAt: new Date('2026-05-25'), usageCount: 0 },
    ],
  })

  await prisma.inventoryMovement.createMany({
    data: [
      {
        productId: PRODUCTS[0].id,
        productName: PRODUCTS[0].name,
        delta: 10,
        reason: 'Carga inicial de inventario',
        actor: 'Seed',
      },
      {
        productId: PRODUCTS[3].id,
        productName: PRODUCTS[3].name,
        delta: -1,
        reason: 'Venta inicial de demo',
        actor: 'Seed',
      },
    ],
  })

  await prisma.stripePayment.createMany({
    data: [
      {
        paymentIntentId: 'pi_seed_001',
        orderCode: 'ORD-001',
        amount: 869000,
        currency: 'cop',
        status: 'succeeded',
      },
      {
        paymentIntentId: 'pi_seed_002',
        orderCode: 'ORD-002',
        amount: 5200000,
        currency: 'cop',
        status: 'succeeded',
      },
    ],
  })

  await prisma.shopifySyncLog.createMany({
    data: [
      {
        orderCode: 'ORD-001',
        status: 'success',
        requestPayload: JSON.stringify({
          orderCode: 'ORD-001',
          items: 2,
          total: 869000,
        }),
        responsePayload: JSON.stringify({
          order: { id: 900001, status: 'paid' },
        }),
      },
      {
        orderCode: 'ORD-003',
        status: 'error',
        requestPayload: JSON.stringify({
          orderCode: 'ORD-003',
          items: 3,
          total: 1410000,
        }),
        responsePayload: JSON.stringify({
          error: 'Shopify credentials missing in staging seed',
        }),
      },
    ],
  })

  await prisma.activityLog.createMany({
    data: [
      { type: 'security', text: 'Auditoria de accesos ejecutada correctamente' },
      { type: 'catalog', text: `Catalogo sincronizado con ${seededProducts.count} productos y ${Object.keys(productsByCategory).length} categorias` },
      { type: 'order', text: 'Datos iniciales de ordenes cargados' },
      { type: 'integrations', text: 'Registros iniciales de Stripe y Shopify creados' },
    ],
  })

  console.log('Seed completed')
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
