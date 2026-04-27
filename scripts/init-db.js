import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('[v0] Inicializando base de datos de Tienda DDC con datos reales de Colombia...')

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

  // Create store settings - Tienda DDC Popayan
  const settings = await prisma.storeSetting.create({
    data: {
      storeName: 'Tienda DDC - Distribuidor Digital Colombia',
      supportEmail: 'soporte@tiendaddc.com.co',
      supportPhone: '+57 602 831 2000',
      taxRate: 19, // IVA Colombia
      freeShippingThreshold: 500000, // Envio gratis sobre $500.000 COP
      currency: 'COP',
      timezone: 'America/Bogota',
    },
  })
  console.log('✓ Configuración de tienda creada')

  // Create admin users
  const passwordHash = await bcrypt.hash('Admin2024!', 10)
  
  const users = [
    {
      fullName: 'José Luis Campo',
      email: 'admin@tiendaddc.com.co',
      role: 'super_admin',
      department: 'Gerencia General',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JoseLuis',
      passwordHash,
    },
    {
      fullName: 'María Fernanda López',
      email: 'operaciones@tiendaddc.com.co',
      role: 'operations_manager',
      department: 'Operaciones',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MariaFernanda',
      passwordHash,
    },
    {
      fullName: 'Carlos Andrés Muñoz',
      email: 'catalogo@tiendaddc.com.co',
      role: 'catalog_manager',
      department: 'Catálogo',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CarlosAndres',
      passwordHash,
    },
    {
      fullName: 'Ana Sofía Rodríguez',
      email: 'soporte@tiendaddc.com.co',
      role: 'support',
      department: 'Atención al Cliente',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AnaSofia',
      passwordHash,
    },
  ]

  await Promise.all(users.map(u => prisma.user.create({ data: u })))
  console.log(`✓ ${users.length} usuarios creados`)

  // PRODUCTOS REALES CON PRECIOS DE COLOMBIA 2024-2026
  const products = [
    // === AUDIO ===
    {
      name: 'AirPods Pro 2da Generación',
      brand: 'Apple',
      category: 'audio',
      price: 1099000,
      originalPrice: 1299000,
      stock: 25,
      rating: 4.8,
      reviews: 847,
      image: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&q=80',
      tags: ['ANC', 'Audio Espacial', 'Chip H2', 'USB-C'],
      description: 'Cancelación activa de ruido 2x más potente. Audio espacial personalizado con seguimiento dinámico de la cabeza. Chip H2 de Apple. Estuche de carga MagSafe con USB-C y altavoz integrado.',
      featured: true,
    },
    {
      name: 'Sony WH-1000XM5',
      brand: 'Sony',
      category: 'audio',
      price: 1599000,
      originalPrice: 1899000,
      stock: 12,
      rating: 4.9,
      reviews: 1203,
      image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80',
      tags: ['ANC Premium', '30h Batería', 'LDAC', 'Multipoint'],
      description: 'Los auriculares con la mejor cancelación de ruido del mercado. 8 micrófonos con procesador V1 integrado. Diseño plegable ultraliviano (250g). Compatible con 360 Reality Audio.',
      featured: true,
    },
    {
      name: 'JBL Tune 770NC',
      brand: 'JBL',
      category: 'audio',
      price: 449000,
      originalPrice: 549000,
      stock: 35,
      rating: 4.5,
      reviews: 523,
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&q=80',
      tags: ['ANC Adaptativo', '70h Batería', 'Bluetooth 5.3'],
      description: 'Auriculares over-ear con cancelación de ruido adaptativa. JBL Pure Bass Sound. Hasta 70 horas de batería. Controles táctiles y asistente de voz integrado.',
      featured: false,
    },
    {
      name: 'Samsung Galaxy Buds3 Pro',
      brand: 'Samsung',
      category: 'audio',
      price: 899000,
      originalPrice: 999000,
      stock: 18,
      rating: 4.6,
      reviews: 312,
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&q=80',
      tags: ['ANC Inteligente', 'Audio 360', 'IPX7'],
      description: 'Diseño blade renovado con controles táctiles. ANC inteligente con detección de conversación. Audio Hi-Fi de 24 bits. Resistencia al agua IPX7.',
      featured: false,
    },
    {
      name: 'Bose QuietComfort Ultra',
      brand: 'Bose',
      category: 'audio',
      price: 1799000,
      originalPrice: null,
      stock: 8,
      rating: 4.8,
      reviews: 276,
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&q=80',
      tags: ['Immersive Audio', 'ANC CustomTune', '24h Batería'],
      description: 'Audio inmersivo Bose con seguimiento espacial. Cancelación de ruido CustomTune que se adapta a tus oídos. Modo consciente ajustable. 24 horas de batería.',
      featured: true,
    },

    // === WEARABLES ===
    {
      name: 'Apple Watch Series 10 GPS 46mm',
      brand: 'Apple',
      category: 'wearables',
      price: 2199000,
      originalPrice: null,
      stock: 10,
      rating: 4.8,
      reviews: 634,
      image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80',
      tags: ['GPS', 'Titanio', 'ECG', 'Always-On'],
      description: 'Pantalla OLED más grande y brillante. Detección de apnea del sueño. Sensor de profundidad para buceo. Chip S10 con doble núcleo. Carga rápida: 80% en 30 min.',
      featured: true,
    },
    {
      name: 'Samsung Galaxy Watch 7 44mm',
      brand: 'Samsung',
      category: 'wearables',
      price: 1299000,
      originalPrice: 1499000,
      stock: 15,
      rating: 4.6,
      reviews: 445,
      image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80',
      tags: ['Wear OS 5', 'BioActive', 'GPS Dual'],
      description: 'Sensor BioActive mejorado para composición corporal y presión arterial. GPS de doble frecuencia. Pantalla Super AMOLED. Wear OS 5 con One UI Watch 6.',
      featured: false,
    },
    {
      name: 'Garmin Fenix 8 AMOLED 47mm',
      brand: 'Garmin',
      category: 'wearables',
      price: 4299000,
      originalPrice: null,
      stock: 5,
      rating: 4.9,
      reviews: 198,
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80',
      tags: ['GPS Multibanda', 'Solar', 'Buceo 40m', 'Mapas'],
      description: 'El reloj deportivo de élite. Pantalla AMOLED táctil con linterna LED. GPS multibanda con mapas TopoActive. Modo buceo hasta 40m. Batería hasta 48 días en modo solar.',
      featured: false,
    },
    {
      name: 'Xiaomi Smart Band 9',
      brand: 'Xiaomi',
      category: 'wearables',
      price: 189000,
      originalPrice: 229000,
      stock: 50,
      rating: 4.4,
      reviews: 1876,
      image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&q=80',
      tags: ['AMOLED', '21 días batería', 'SpO2'],
      description: 'Pantalla AMOLED de 1.62". Más de 150 modos deportivos. Monitoreo de sueño y SpO2. Resistencia al agua 5ATM. Batería de hasta 21 días.',
      featured: false,
    },

    // === COMPUTACION ===
    {
      name: 'MacBook Air M3 15" 16GB/512GB',
      brand: 'Apple',
      category: 'computing',
      price: 7499000,
      originalPrice: null,
      stock: 6,
      rating: 4.9,
      reviews: 287,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80',
      tags: ['Chip M3', '16GB RAM', '512GB SSD', 'Liquid Retina'],
      description: 'El portátil más delgado del mundo con chip M3 de 8 núcleos. GPU de 10 núcleos. Pantalla Liquid Retina de 15.3". Hasta 18 horas de batería. MagSafe, 2 Thunderbolt y audio jack.',
      featured: true,
    },
    {
      name: 'MacBook Pro 14" M3 Pro 18GB/512GB',
      brand: 'Apple',
      category: 'computing',
      price: 11999000,
      originalPrice: null,
      stock: 4,
      rating: 4.9,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=600&q=80',
      tags: ['M3 Pro', '18GB RAM', 'XDR Display', 'ProRes'],
      description: 'Chip M3 Pro con CPU de 12 núcleos y GPU de 18 núcleos. Pantalla Liquid Retina XDR con ProMotion. 3 puertos Thunderbolt 4, HDMI 2.1, slot SD. Hasta 17 horas de batería.',
      featured: true,
    },
    {
      name: 'ASUS ROG Zephyrus G16 RTX 4070',
      brand: 'ASUS',
      category: 'computing',
      price: 9899000,
      originalPrice: 10999000,
      stock: 3,
      rating: 4.7,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80',
      tags: ['Intel Core Ultra 9', 'RTX 4070', 'OLED 240Hz'],
      description: 'Laptop gaming con Intel Core Ultra 9 185H. NVIDIA RTX 4070 Laptop GPU. Pantalla OLED 16" QHD+ 240Hz. 32GB DDR5, 1TB NVMe. Teclado mecánico y AniMe Matrix.',
      featured: false,
    },
    {
      name: 'Lenovo IdeaPad Slim 5 16"',
      brand: 'Lenovo',
      category: 'computing',
      price: 3299000,
      originalPrice: 3799000,
      stock: 12,
      rating: 4.5,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600&q=80',
      tags: ['Ryzen 7 7730U', '16GB RAM', '512GB SSD'],
      description: 'AMD Ryzen 7 7730U. Pantalla IPS 16" 2.5K 120Hz. 16GB DDR5 y 512GB SSD NVMe. Batería de hasta 14 horas. Diseño delgado en aluminio de solo 1.89kg.',
      featured: false,
    },
    {
      name: 'iPad Pro 13" M4 256GB WiFi',
      brand: 'Apple',
      category: 'computing',
      price: 6499000,
      originalPrice: null,
      stock: 7,
      rating: 4.8,
      reviews: 203,
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&q=80',
      tags: ['Chip M4', 'Ultra Retina XDR', 'Tandem OLED'],
      description: 'La tablet más potente. Chip M4 de 10 núcleos. Primera pantalla Tandem OLED del mundo con HDR extremo. Face ID, USB-C Thunderbolt. Compatible con Apple Pencil Pro.',
      featured: false,
    },

    // === PERIFERICOS ===
    {
      name: 'Logitech MX Master 3S',
      brand: 'Logitech',
      category: 'peripherals',
      price: 449000,
      originalPrice: 529000,
      stock: 22,
      rating: 4.8,
      reviews: 1456,
      image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&q=80',
      tags: ['8000 DPI', 'MagSpeed', 'Multi-device', 'USB-C'],
      description: 'El mouse más avanzado. Rueda MagSpeed con desplazamiento de 1000 líneas/segundo. Sensor Darkfield 8000 DPI. Conecta hasta 3 dispositivos. 70 días de batería.',
      featured: true,
    },
    {
      name: 'Logitech MX Keys S',
      brand: 'Logitech',
      category: 'peripherals',
      price: 549000,
      originalPrice: 649000,
      stock: 18,
      rating: 4.7,
      reviews: 892,
      image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&q=80',
      tags: ['Retroiluminado', 'Multi-device', 'Smart Actions'],
      description: 'Teclado inalámbrico premium con teclas cóncavas Perfect Stroke. Retroiluminación inteligente. Smart Actions personalizables. Batería recargable de 10 días.',
      featured: false,
    },
    {
      name: 'LG UltraGear 27" QHD 180Hz',
      brand: 'LG',
      category: 'peripherals',
      price: 1599000,
      originalPrice: 1899000,
      stock: 8,
      rating: 4.6,
      reviews: 367,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&q=80',
      tags: ['180Hz', '1ms GtG', 'NVIDIA G-Sync', 'HDR10'],
      description: 'Monitor gaming IPS Nano de 27" QHD 2560x1440. 180Hz y 1ms GtG. Compatible con NVIDIA G-Sync y AMD FreeSync Premium. HDR10 y 98% DCI-P3.',
      featured: false,
    },
    {
      name: 'Samsung Odyssey G7 32" Curvo',
      brand: 'Samsung',
      category: 'peripherals',
      price: 2199000,
      originalPrice: 2599000,
      stock: 5,
      rating: 4.7,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=600&q=80',
      tags: ['240Hz', 'QLED', '1000R Curvo', 'G-Sync'],
      description: 'Monitor gaming curvo 1000R de 32" QHD. Panel QLED VA 240Hz con 1ms. G-Sync y FreeSync Premium Pro. HDR600 con 350 nits típicos.',
      featured: false,
    },
    {
      name: 'Razer BlackWidow V4 75%',
      brand: 'Razer',
      category: 'peripherals',
      price: 749000,
      originalPrice: 849000,
      stock: 14,
      rating: 4.6,
      reviews: 445,
      image: 'https://images.unsplash.com/photo-1593640408182-31c228a7f8d2?w=600&q=80',
      tags: ['Hot-Swap', 'Razer Chroma RGB', 'Dial', 'Gasket'],
      description: 'Teclado mecánico 75% con switches hot-swappable. Dial de control multimedia. Montaje gasket para escritura suave. Chroma RGB de 16.8M colores.',
      featured: false,
    },
    {
      name: 'HyperX Cloud III Wireless',
      brand: 'HyperX',
      category: 'peripherals',
      price: 699000,
      originalPrice: 799000,
      stock: 16,
      rating: 4.5,
      reviews: 567,
      image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=600&q=80',
      tags: ['2.4GHz Wireless', 'DTS:X', '120h Batería'],
      description: 'Audífonos gaming inalámbricos con drivers de 53mm. DTS Headphone:X Spatial Audio. Micrófono con cancelación de ruido. Hasta 120 horas de batería.',
      featured: false,
    },

    // === ALMACENAMIENTO ===
    {
      name: 'Samsung 990 Pro 2TB NVMe',
      brand: 'Samsung',
      category: 'storage',
      price: 849000,
      originalPrice: 999000,
      stock: 20,
      rating: 4.9,
      reviews: 789,
      image: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=600&q=80',
      tags: ['PCIe 4.0', '7450 MB/s', 'PS5 Compatible'],
      description: 'El SSD NVMe más rápido de Samsung. Velocidades de lectura hasta 7.450 MB/s y escritura 6.900 MB/s. Disipador opcional incluido. Ideal para PS5 y PC gaming.',
      featured: true,
    },
    {
      name: 'Samsung T7 Shield 2TB',
      brand: 'Samsung',
      category: 'storage',
      price: 649000,
      originalPrice: 799000,
      stock: 15,
      rating: 4.7,
      reviews: 456,
      image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
      tags: ['IP65', '1050 MB/s', 'USB 3.2'],
      description: 'SSD portátil resistente IP65 contra agua y polvo. Velocidades de hasta 1.050 MB/s. Encriptación por hardware AES 256-bit. Compacto y resistente a caídas de 3m.',
      featured: false,
    },
    {
      name: 'SanDisk Extreme PRO 4TB',
      brand: 'SanDisk',
      category: 'storage',
      price: 1199000,
      originalPrice: 1399000,
      stock: 10,
      rating: 4.6,
      reviews: 312,
      image: 'https://images.unsplash.com/photo-1608614246424-31a91d9f0890?w=600&q=80',
      tags: ['2000 MB/s', 'IP55', 'NVMe'],
      description: 'SSD portátil profesional con velocidades de hasta 2.000 MB/s. NVMe con USB-C 3.2 Gen 2x2. Resistencia IP55. Carcasa de aluminio forjado.',
      featured: false,
    },
    {
      name: 'WD Black SN850X 1TB',
      brand: 'Western Digital',
      category: 'storage',
      price: 449000,
      originalPrice: 549000,
      stock: 25,
      rating: 4.8,
      reviews: 634,
      image: 'https://images.unsplash.com/photo-1628557113-d137e6f50b16?w=600&q=80',
      tags: ['PCIe 4.0', '7300 MB/s', 'Game Mode 2.0'],
      description: 'SSD gaming con Game Mode 2.0 para cargas predictivas. Lectura hasta 7.300 MB/s. Disipador con iluminación RGB opcional. Optimizado para DirectStorage.',
      featured: false,
    },

    // === CARGADORES Y ACCESORIOS ===
    {
      name: 'Anker Prime 200W GaN',
      brand: 'Anker',
      category: 'peripherals',
      price: 399000,
      originalPrice: 479000,
      stock: 28,
      rating: 4.7,
      reviews: 923,
      image: 'https://images.unsplash.com/photo-1587756096568-ce1a458d7d73?w=600&q=80',
      tags: ['200W GaN', '4 Puertos', 'PowerIQ 4.0'],
      description: 'Cargador compacto 200W con tecnología GaN. 2 USB-C (100W c/u) + 2 USB-A. PowerIQ 4.0 con distribución inteligente. Certificación MFi para Apple.',
      featured: false,
    },
    {
      name: 'Apple MagSafe Charger 15W',
      brand: 'Apple',
      category: 'peripherals',
      price: 249000,
      originalPrice: null,
      stock: 40,
      rating: 4.5,
      reviews: 1234,
      image: 'https://images.unsplash.com/photo-1622838320000-82e12b0e9e47?w=600&q=80',
      tags: ['MagSafe', '15W', 'iPhone 12+'],
      description: 'Cargador inalámbrico MagSafe original de Apple. 15W de carga rápida magnética. Compatible con iPhone 12 y posteriores. Cable USB-C de 1m incluido.',
      featured: false,
    },
    {
      name: 'Elgato Wave:3',
      brand: 'Elgato',
      category: 'peripherals',
      price: 649000,
      originalPrice: 749000,
      stock: 12,
      rating: 4.8,
      reviews: 534,
      image: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&q=80',
      tags: ['USB-C', '24-bit/96kHz', 'Clipguard'],
      description: 'Micrófono de condensador premium para streaming. Cápsula propietaria con patrón cardioide. Tecnología Clipguard anti-distorsión. Mezclador digital Wave Link incluido.',
      featured: false,
    },
    {
      name: 'Logitech StreamCam',
      brand: 'Logitech',
      category: 'peripherals',
      price: 549000,
      originalPrice: 649000,
      stock: 10,
      rating: 4.6,
      reviews: 423,
      image: 'https://images.unsplash.com/photo-1616469829941-c7200edec809?w=600&q=80',
      tags: ['1080p 60fps', 'USB-C', 'Auto-focus AI'],
      description: 'Webcam Full HD 1080p a 60fps. Enfoque automático con IA. Detección facial Smart Exposure. Doble micrófono omnidireccional. Rotación vertical para streaming.',
      featured: false,
    },
  ]

  const createdProducts = await Promise.all(
    products.map(p => prisma.product.create({ data: p }))
  )
  console.log(`✓ ${createdProducts.length} productos reales de Colombia creados`)

  // CLIENTES REALES DE DIFERENTES CIUDADES DE COLOMBIA
  const customers = [
    {
      name: 'José Luis Campo Zambrano',
      email: 'joseluiscampoz@gmail.com',
      phone: '+57 302 456 7890',
      city: 'Popayán',
      tier: 'Platinum',
      status: 'vip',
      lifetimeValue: 15600000,
      orders: 12,
    },
    {
      name: 'María Fernanda Gómez',
      email: 'mariafgomez@outlook.com',
      phone: '+57 310 234 5678',
      city: 'Bogotá',
      tier: 'Gold',
      status: 'active',
      lifetimeValue: 8900000,
      orders: 7,
    },
    {
      name: 'Carlos Andrés Pérez',
      email: 'carlosperez.tech@gmail.com',
      phone: '+57 315 876 5432',
      city: 'Medellín',
      tier: 'Gold',
      status: 'active',
      lifetimeValue: 6500000,
      orders: 5,
    },
    {
      name: 'Ana Sofía Rodríguez',
      email: 'anasofiar@hotmail.com',
      phone: '+57 300 111 2233',
      city: 'Cali',
      tier: 'Silver',
      status: 'active',
      lifetimeValue: 3200000,
      orders: 3,
    },
    {
      name: 'Diego Alejandro Muñoz',
      email: 'diegomdev@gmail.com',
      phone: '+57 318 999 8877',
      city: 'Barranquilla',
      tier: 'Gold',
      status: 'active',
      lifetimeValue: 7800000,
      orders: 6,
    },
    {
      name: 'Laura Valentina Torres',
      email: 'lvtorres.co@gmail.com',
      phone: '+57 301 444 5566',
      city: 'Cartagena',
      tier: 'Silver',
      status: 'active',
      lifetimeValue: 2400000,
      orders: 2,
    },
    {
      name: 'Sebastián Camilo Herrera',
      email: 'sebas.herrera@yahoo.com',
      phone: '+57 312 777 6655',
      city: 'Bucaramanga',
      tier: 'Bronze',
      status: 'active',
      lifetimeValue: 1500000,
      orders: 1,
    },
    {
      name: 'Valentina Ríos Ospina',
      email: 'valrios.o@gmail.com',
      phone: '+57 314 222 3344',
      city: 'Pereira',
      tier: 'Silver',
      status: 'active',
      lifetimeValue: 2800000,
      orders: 2,
    },
    {
      name: 'Andrés Felipe Castro',
      email: 'afelipecastro@gmail.com',
      phone: '+57 320 888 9900',
      city: 'Manizales',
      tier: 'Gold',
      status: 'active',
      lifetimeValue: 5600000,
      orders: 4,
    },
    {
      name: 'Camila Andrea Vargas',
      email: 'camilavargas.tech@outlook.com',
      phone: '+57 316 333 4455',
      city: 'Santa Marta',
      tier: 'Bronze',
      status: 'new',
      lifetimeValue: 890000,
      orders: 1,
    },
  ]

  await Promise.all(customers.map(c => prisma.customer.create({ data: c })))
  console.log(`✓ ${customers.length} clientes de Colombia creados`)

  // ORDENES DE EJEMPLO REALISTAS
  const orders = [
    {
      orderCode: 'DDC-2024-001',
      customerEmail: 'joseluiscampoz@gmail.com',
      total: 2698000,
      status: 'completed',
      items: 2,
      channel: 'Web',
    },
    {
      orderCode: 'DDC-2024-002',
      customerEmail: 'mariafgomez@outlook.com',
      total: 7499000,
      status: 'completed',
      items: 1,
      channel: 'Web',
    },
    {
      orderCode: 'DDC-2024-003',
      customerEmail: 'carlosperez.tech@gmail.com',
      total: 1599000,
      status: 'processing',
      items: 1,
      channel: 'Web',
    },
    {
      orderCode: 'DDC-2024-004',
      customerEmail: 'diegomdev@gmail.com',
      total: 3048000,
      status: 'completed',
      items: 3,
      channel: 'Web',
    },
    {
      orderCode: 'DDC-2024-005',
      customerEmail: 'anasofiar@hotmail.com',
      total: 1099000,
      status: 'pending',
      items: 1,
      channel: 'Web',
    },
  ]

  await Promise.all(orders.map(o => prisma.order.create({ data: o })))
  console.log(`✓ ${orders.length} órdenes de ejemplo creadas`)

  // CAMPAÑAS PROMOCIONALES COLOMBIANAS
  const campaigns = [
    {
      name: 'Día sin IVA Colombia',
      code: 'SINIVA2024',
      discountType: 'percent',
      discountValue: 19,
      status: 'active',
      startsAt: new Date('2024-11-28'),
      endsAt: new Date('2024-11-29'),
      usageCount: 234,
    },
    {
      name: 'Black Friday Colombia',
      code: 'BLACKFRIDAY50',
      discountType: 'percent',
      discountValue: 50,
      status: 'ended',
      startsAt: new Date('2024-11-29'),
      endsAt: new Date('2024-12-01'),
      usageCount: 567,
    },
    {
      name: 'Navidad Tech 2024',
      code: 'NAVIDAD100K',
      discountType: 'fixed',
      discountValue: 100000,
      status: 'active',
      startsAt: new Date('2024-12-01'),
      endsAt: new Date('2024-12-25'),
      usageCount: 89,
    },
    {
      name: 'Bienvenida 2025',
      code: 'BIENVENIDO15',
      discountType: 'percent',
      discountValue: 15,
      status: 'draft',
      startsAt: new Date('2025-01-01'),
      endsAt: new Date('2025-01-31'),
      usageCount: 0,
    },
    {
      name: 'Amor y Amistad',
      code: 'AMORYAMISTAD',
      discountType: 'fixed',
      discountValue: 50000,
      status: 'ended',
      startsAt: new Date('2024-09-14'),
      endsAt: new Date('2024-09-21'),
      usageCount: 156,
    },
  ]

  await Promise.all(campaigns.map(c => prisma.campaign.create({ data: c })))
  console.log(`✓ ${campaigns.length} campañas promocionales creadas`)

  // ACTIVITY LOG
  const activities = [
    { type: 'order', text: 'Nueva orden DDC-2024-005 por $1.099.000 COP' },
    { type: 'customer', text: 'Nuevo cliente VIP: José Luis Campo Zambrano' },
    { type: 'product', text: 'Stock bajo: Samsung 990 Pro 2TB (20 unidades)' },
    { type: 'campaign', text: 'Campaña "Navidad Tech 2024" activada' },
    { type: 'system', text: 'Base de datos sincronizada correctamente' },
  ]

  await Promise.all(activities.map(a => prisma.activityLog.create({ data: a })))
  console.log(`✓ ${activities.length} actividades registradas`)

  console.log('\n[v0] ✅ Base de datos inicializada con datos reales de Colombia')
  console.log('📧 Admin: admin@tiendaddc.com.co')
  console.log('🔑 Password: Admin2024!')
}

main()
  .catch((e) => {
    console.error('[v0] Error durante inicialización:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
