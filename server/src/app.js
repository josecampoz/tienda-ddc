import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import storeRoutes from './routes/store.routes.js'
import integrationsRoutes from './routes/integrations.routes.js'
import analyticsRoutes from './routes/analytics.routes.js'

export function createApp() {
  const app = express()

  // CORS configurado para multiples origenes
  const allowedOrigins = [
    process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
    'https://tienda-virtual-ddc.vercel.app',
    'https://tienda-ddc.vercel.app',
  ]
  
  app.use(cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (como mobile apps o curl)
      if (!origin) return callback(null, true)
      if (allowedOrigins.some(allowed => origin.startsWith(allowed.replace(/\/$/, '')))) {
        return callback(null, true)
      }
      return callback(null, true) // En desarrollo, permitir todos
    },
    credentials: true,
  }))
  
  app.use(express.json({ limit: '1mb' }))

  // Rutas de la API
  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/store', storeRoutes)
  app.use('/api/integrations', integrationsRoutes)
  app.use('/api/analytics', analyticsRoutes)

  app.get('/', (_req, res) => {
    res.json({ ok: true, message: 'Tienda DDC backend running' })
  })

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  })

  return app
}
