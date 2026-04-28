/**
 * ProductCatalogService - Gestion del catalogo de productos
 * 
 * Responsabilidades:
 * - CRUD de productos via Prisma ORM
 * - Gestion de inventario con trazabilidad
 * - Publicacion de eventos de productos via DataProductPublisher
 * - Sincronizacion con Shopify (opcional)
 */

import { prisma } from '../lib/prisma.js'
import { dataProductPublisher, EventTypes } from './DataProductPublisher.js'

class ProductCatalogService {
  /**
   * Obtiene todos los productos del catalogo
   */
  async getProducts(filters = {}) {
    const where = {}

    if (filters.category) where.category = filters.category
    if (filters.brand) where.brand = filters.brand
    if (filters.featured !== undefined) where.featured = filters.featured
    if (filters.inStock) where.stock = { gt: 0 }

    const products = await prisma.product.findMany({
      where,
      orderBy: filters.orderBy || { createdAt: 'desc' },
    })

    return products.map(this.mapProduct)
  }

  /**
   * Obtiene un producto por ID
   */
  async getProductById(id) {
    const product = await prisma.product.findUnique({ where: { id } })
    return product ? this.mapProduct(product) : null
  }

  /**
   * Registra la visualizacion de un producto (evento analitico)
   */
  async recordProductView(productId, userEmail = null, sessionId = null) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return null

    await dataProductPublisher.publish(EventTypes.PRODUCT_VIEWED, {
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      productPrice: product.price,
      userEmail,
    }, {
      sessionId,
      timestamp: new Date().toISOString(),
    })

    return product
  }

  /**
   * Registra cuando un producto se agrega al carrito
   */
  async recordAddToCart(productId, quantity, userEmail = null, sessionId = null) {
    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) return null

    await dataProductPublisher.publish(EventTypes.PRODUCT_ADDED_TO_CART, {
      productId: product.id,
      productName: product.name,
      productCategory: product.category,
      productPrice: product.price,
      quantity,
      userEmail,
    }, {
      sessionId,
      timestamp: new Date().toISOString(),
    })

    return product
  }

  /**
   * Crea un nuevo producto
   */
  async createProduct(productData) {
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        brand: productData.brand,
        category: productData.category,
        price: productData.price,
        originalPrice: productData.originalPrice,
        stock: productData.stock || 0,
        rating: productData.rating || 4.5,
        reviews: productData.reviews || 0,
        image: productData.image,
        description: productData.description,
        tags: productData.tags || [],
        featured: productData.featured || false,
      },
    })

    // Registrar movimiento de inventario inicial
    if (product.stock > 0) {
      await this.recordInventoryMovement(product.id, product.name, product.stock, 'Stock inicial', 'Sistema')
    }

    return this.mapProduct(product)
  }

  /**
   * Actualiza un producto existente
   */
  async updateProduct(id, productData) {
    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) throw new Error('Producto no encontrado')

    const product = await prisma.product.update({
      where: { id },
      data: productData,
    })

    // Si cambio el stock, registrar movimiento
    if (productData.stock !== undefined && productData.stock !== existing.stock) {
      const delta = productData.stock - existing.stock
      await this.recordInventoryMovement(
        product.id,
        product.name,
        delta,
        'Ajuste manual de inventario',
        'Admin'
      )
    }

    return this.mapProduct(product)
  }

  /**
   * Elimina un producto
   */
  async deleteProduct(id) {
    await prisma.product.delete({ where: { id } })
    return true
  }

  /**
   * Actualiza el stock de un producto con trazabilidad
   */
  async updateStock(productId, delta, reason, actor) {
    const product = await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: delta } },
    })

    await this.recordInventoryMovement(productId, product.name, delta, reason, actor)

    // Publicar evento de inventario
    await dataProductPublisher.publish(EventTypes.INVENTORY_UPDATED, {
      productId,
      productName: product.name,
      delta,
      newStock: product.stock,
      reason,
      actor,
    })

    return this.mapProduct(product)
  }

  /**
   * Registra un movimiento de inventario
   */
  async recordInventoryMovement(productId, productName, delta, reason, actor) {
    await prisma.inventoryMovement.create({
      data: {
        productId,
        productName,
        delta,
        reason,
        actor,
      },
    })
  }

  /**
   * Obtiene el historial de movimientos de inventario
   */
  async getInventoryMovements(productId = null, limit = 50) {
    const where = productId ? { productId } : {}
    
    return prisma.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Obtiene productos con bajo stock
   */
  async getLowStockProducts(threshold = 10) {
    return prisma.product.findMany({
      where: { stock: { lte: threshold } },
      orderBy: { stock: 'asc' },
    })
  }

  /**
   * Obtiene estadisticas del catalogo
   */
  async getCatalogStats() {
    const [totalProducts, outOfStock, lowStock, categories] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { stock: 0 } }),
      prisma.product.count({ where: { stock: { lte: 10, gt: 0 } } }),
      prisma.product.groupBy({
        by: ['category'],
        _count: { id: true },
      }),
    ])

    return {
      totalProducts,
      outOfStock,
      lowStock,
      inStock: totalProducts - outOfStock,
      categoryCounts: categories.reduce((acc, c) => {
        acc[c.category] = c._count.id
        return acc
      }, {}),
    }
  }

  /**
   * Mapea un producto de Prisma a formato API
   */
  mapProduct(product) {
    return {
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      price: product.price,
      originalPrice: product.originalPrice,
      stock: product.stock,
      rating: product.rating,
      reviews: product.reviews,
      image: product.image,
      description: product.description,
      tags: product.tags,
      featured: product.featured,
    }
  }
}

export const productCatalogService = new ProductCatalogService()
