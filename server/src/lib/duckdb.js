/**
 * DuckDB - Motor OLAP embebido para el plano analitico
 * 
 * Arquitectura Dual de Datos:
 * - PostgreSQL: Plano transaccional (ACID) - ordenes, usuarios, inventario
 * - DuckDB: Plano analitico (OLAP) - consultas complejas, agregaciones, rankings
 * 
 * Esta separacion mitiga el anti-patron de mezclar carga transaccional y
 * analitica en el mismo motor, evitando cuellos de botella en hora pico.
 */

import Database from 'duckdb-async'
import path from 'path'
import fs from 'fs'

class DuckDBManager {
  constructor() {
    this.db = null
    this.connection = null
    this.initialized = false
  }

  async initialize() {
    if (this.initialized) return

    try {
      // Crear directorio de datos si no existe
      const dataDir = path.join(process.cwd(), 'data')
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
      }

      const dbPath = path.join(dataDir, 'analytics.duckdb')
      this.db = await Database.create(dbPath)
      this.connection = await this.db.connect()

      // Crear tablas analiticas
      await this.createTables()
      
      this.initialized = true
      console.log('[DuckDB] Motor analitico inicializado en:', dbPath)
    } catch (error) {
      console.warn('[DuckDB] No se pudo inicializar:', error.message)
      // DuckDB es opcional - el sistema funciona sin el
    }
  }

  async createTables() {
    // Tabla principal de eventos de negocio
    await this.connection.run(`
      CREATE TABLE IF NOT EXISTS business_events (
        id VARCHAR PRIMARY KEY,
        event_type VARCHAR NOT NULL,
        payload JSON,
        metadata JSON,
        timestamp TIMESTAMP NOT NULL,
        source VARCHAR,
        version VARCHAR
      )
    `)

    // Vista materializada para metricas de conversion
    await this.connection.run(`
      CREATE VIEW IF NOT EXISTS conversion_funnel AS
      SELECT 
        event_type,
        DATE_TRUNC('day', timestamp) as date,
        COUNT(*) as event_count
      FROM business_events
      WHERE event_type IN ('ProductViewed', 'ProductAddedToCart', 'CheckoutStarted', 'OrderCreated', 'OrderCompleted')
      GROUP BY event_type, DATE_TRUNC('day', timestamp)
    `)

    // Vista para productos mas vistos vs comprados
    await this.connection.run(`
      CREATE VIEW IF NOT EXISTS product_performance AS
      SELECT 
        json_extract_string(payload, '$.productId') as product_id,
        json_extract_string(payload, '$.productName') as product_name,
        COUNT(CASE WHEN event_type = 'ProductViewed' THEN 1 END) as views,
        COUNT(CASE WHEN event_type = 'ProductAddedToCart' THEN 1 END) as adds_to_cart,
        COUNT(CASE WHEN event_type = 'OrderCreated' THEN 1 END) as purchases
      FROM business_events
      GROUP BY product_id, product_name
    `)

    // Vista para analisis por dia de la semana
    await this.connection.run(`
      CREATE VIEW IF NOT EXISTS orders_by_weekday AS
      SELECT 
        DAYOFWEEK(timestamp) as weekday,
        COUNT(*) as order_count,
        AVG(CAST(json_extract_string(payload, '$.total') AS DOUBLE)) as avg_ticket
      FROM business_events
      WHERE event_type = 'OrderCreated'
      GROUP BY DAYOFWEEK(timestamp)
    `)
  }

  getConnection() {
    if (!this.connection) {
      throw new Error('DuckDB no inicializado. Llama a initialize() primero.')
    }
    return this.connection
  }

  async query(sql, params = []) {
    if (!this.connection) {
      await this.initialize()
    }
    return this.connection.all(sql, params)
  }

  async close() {
    if (this.connection) {
      await this.connection.close()
    }
    if (this.db) {
      await this.db.close()
    }
    this.initialized = false
  }
}

export const duckdb = new DuckDBManager()

export async function initDuckDB() {
  await duckdb.initialize()
}
