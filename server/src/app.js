import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import storeRoutes from './routes/store.routes.js'
import integrationsRoutes from './routes/integrations.routes.js'

export function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }))
  app.use(express.json({ limit: '1mb' }))

  app.use('/api/health', healthRoutes)
  app.use('/api/auth', authRoutes)
  app.use('/api/admin', adminRoutes)
  app.use('/api/store', storeRoutes)
  app.use('/api/integrations', integrationsRoutes)

  app.get('/', (_req, res) => {
    res.json({ ok: true, message: 'Tienda DDC backend running' })
  })

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({ message: 'Internal server error' })
  })

  return app
}
