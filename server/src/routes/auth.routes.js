import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../lib/prisma.js'
import { signAuthToken } from '../lib/jwt.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { ROLE_META } from '../config/roles.js'
import { logActivity } from '../utils/activity.js'

const router = Router()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(4),
})

const userSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  role: z.enum(['super_admin', 'operations_manager', 'catalog_manager', 'analyst', 'support']),
  department: z.string().min(2),
  password: z.string().min(8),
})

const sanitizeUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
  department: user.department,
  active: user.active,
  avatar: user.avatar,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
})

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Credenciales invalidas' })
  }

  const email = parsed.data.email.trim().toLowerCase()
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    return res.status(401).json({ message: 'No existe una cuenta asociada a ese correo' })
  }

  if (!user.active) {
    return res.status(403).json({ message: 'Tu cuenta esta inactiva. Contacta al administrador' })
  }

  const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash)
  if (!isValid) {
    return res.status(401).json({ message: 'Credenciales incorrectas' })
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  await logActivity('security', `Inicio de sesion de ${updated.email}`)

  const token = signAuthToken({ sub: updated.id, role: updated.role })

  return res.json({
    token,
    user: sanitizeUser(updated),
    roleMeta: ROLE_META,
  })
})

router.get('/me', requireAuth, async (req, res) => {
  return res.json({
    user: sanitizeUser(req.user),
    roleMeta: ROLE_META,
  })
})

router.get('/users', requireAuth, requirePermission('users'), async (_req, res) => {
  const users = await prisma.user.findMany({ orderBy: { createdAt: 'desc' } })
  return res.json({ users: users.map(sanitizeUser) })
})

router.post('/users', requireAuth, requirePermission('users'), async (req, res) => {
  const parsed = userSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ message: 'Datos de usuario invalidos' })
  }

  const payload = parsed.data
  const normalizedEmail = payload.email.trim().toLowerCase()

  const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } })
  if (exists) {
    return res.status(409).json({ message: 'Ese correo ya esta registrado' })
  }

  const passwordHash = await bcrypt.hash(payload.password, 10)
  const avatar = payload.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase()

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName,
      email: normalizedEmail,
      role: payload.role,
      department: payload.department,
      avatar,
      passwordHash,
    },
  })

  await logActivity('security', `Nuevo usuario ${user.email} creado con rol ${ROLE_META[user.role]?.label}`)
  return res.status(201).json({ user: sanitizeUser(user) })
})

router.patch('/users/:id/status', requireAuth, requirePermission('users'), async (req, res) => {
  const { active } = req.body
  if (typeof active !== 'boolean') {
    return res.status(400).json({ message: 'Parametro active invalido' })
  }

  const user = await prisma.user.update({
    where: { id: req.params.id },
    data: { active },
  })

  await logActivity('security', `${user.email} ${active ? 'activado' : 'desactivado'} por ${req.user.email}`)

  return res.json({ user: sanitizeUser(user) })
})

export default router
