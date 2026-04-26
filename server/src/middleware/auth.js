import { prisma } from '../lib/prisma.js'
import { hasPermission } from '../config/roles.js'
import { verifyAuthToken } from '../lib/jwt.js'

export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'No autorizado' })
  }

  try {
    const payload = verifyAuthToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })

    if (!user || !user.active) {
      return res.status(401).json({ message: 'Sesion invalida o usuario inactivo' })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ message: 'Token invalido' })
  }
}

export const requirePermission = (permission) => (req, res, next) => {
  const role = req.user?.role

  if (!hasPermission(role, permission)) {
    return res.status(403).json({ message: 'No tienes permisos para esta accion' })
  }

  next()
}
