import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('[v0] Inicializando base de datos de Tienda DDC...')

  // Clear existing data
  await prisma.shopifySyncLog.deleteMany()
  await prisma.stripePayment.deleteMany()
  await prisma.inventoryMovement.deleteMany()
  await prisma.activityLog.deleteMany()
  await prisma.campaign.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.user.deleteMany()
  await prisma.product.deleteMany()
  await prisma.storeSetting.deleteMany()

  // Create store settings
  const settings = await prisma.storeSetting.create({
    data: {
      storeName: 'Tienda DDC',
      supportEmail: 'soporte@tiendaddc.com',
      supportPhone: '+57 602 000 0000',
      taxRate: 19,
      freeShippingThreshold: 500000,
      currency: 'COP',
      timezone: 'America/Bogota',
    },
  })
  console.log('✓ Configuración de tienda creada')

  // Create super admin user
  const adminUser = await prisma.user.create({
    data: {
      fullName: 'Admin DDC',
      email: 'admin@tiendaddc.com',
      role: 'super_admin',
      department: 'Management',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
      passwordHash: '$2b$10$I9xwUkakW2P/sX0c8JuYIuPPONjZb5d0MLmOlVs3Eaq7oJ2j0jJpW', // password: admin123
    },
  })
  console.log('✓ Usuario admin creado')

  // Create sample products
  const products = [
    {
      name: 'Laptop Pro 15"',
      brand: 'TechCorp',
      category: 'electronics',
      price: 2500000,
      originalPrice: 2800000,
      stock: 15,
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=500&h=500&fit=crop',
      description: 'Laptop de alta potencia para profesionales',
      rating: 4.8,
      reviews: 156,
      tags: ['laptop', 'pro', 'portátil'],
      featured: true,
    },
    {
      name: 'Auriculares Inalámbricos',
      brand: 'SoundMax',
      category: 'electronics',
      price: 350000,
      originalPrice: 450000,
      stock: 45,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
      description: 'Auriculares con cancelación de ruido activa',
      rating: 4.5,
      reviews: 89,
      tags: ['auriculares', 'inalámbricos', 'sonido'],
      featured: true,
    },
    {
      name: 'Monitor 4K 32"',
      brand: 'VisionTech',
      category: 'electronics',
      price: 1200000,
      originalPrice: 1500000,
      stock: 22,
      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
      description: 'Monitor ultra HD para diseño y gaming',
      rating: 4.7,
      reviews: 234,
      tags: ['monitor', '4k', 'diseño'],
      featured: false,
    },
    {
      name: 'Teclado Mecánico RGB',
      brand: 'KeyForce',
      category: 'electronics',
      price: 280000,
      originalPrice: 350000,
      stock: 60,
      image: 'https://images.unsplash.com/photo-1587829191301-76ec4dc17537?w=500&h=500&fit=crop',
      description: 'Teclado mecánico con iluminación RGB',
      rating: 4.6,
      reviews: 412,
      tags: ['teclado', 'gaming', 'rgb'],
      featured: true,
    },
    {
      name: 'Mouse Óptico Inalámbrico',
      brand: 'Precision',
      category: 'electronics',
      price: 120000,
      originalPrice: 180000,
      stock: 80,
      image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
      description: 'Mouse óptico con precisión profesional',
      rating: 4.4,
      reviews: 567,
      tags: ['mouse', 'óptico', 'gaming'],
      featured: false,
    },
  ]

  const createdProducts = await Promise.all(
    products.map((p) =>
      prisma.product.create({
        data: {
          ...p,
          featured: p.featured || false,
        },
      })
    )
  )
  console.log(`✓ ${createdProducts.length} productos de ejemplo creados`)

  // Create sample customers
  const customers = [
    {
      name: 'José Luis Campo',
      email: 'jose@ejemplo.com',
      phone: '+57 300 123 4567',
      city: 'Popayán',
      tier: 'Gold',
      status: 'active',
    },
    {
      name: 'María García',
      email: 'maria@ejemplo.com',
      phone: '+57 310 987 6543',
      city: 'Bogotá',
      tier: 'Platinum',
      status: 'vip',
    },
  ]

  const createdCustomers = await Promise.all(
    customers.map((c) => prisma.customer.create({ data: c }))
  )
  console.log(`✓ ${createdCustomers.length} clientes de ejemplo creados`)

  // Log initialization activity
  await prisma.activityLog.create({
    data: {
      type: 'system',
      text: 'Base de datos inicializada',
    },
  })

  console.log('[v0] ✓ Base de datos inicializada correctamente')
}

main()
  .catch((e) => {
    console.error('[v0] Error durante inicialización:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
