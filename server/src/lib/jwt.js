import jwt from 'jsonwebtoken'
import crypto from 'crypto'

// Generate a secure random secret if not provided (for development only)
const generateDevSecret = () => {
  const secret = crypto.randomBytes(64).toString('hex')
  console.warn('[SECURITY] Using auto-generated JWT_SECRET. Set JWT_SECRET env var in production!')
  return secret
}

const secret = process.env.JWT_SECRET || generateDevSecret()
const expiresIn = process.env.JWT_EXPIRES_IN || '8h'

// Validate that JWT_SECRET is secure in production
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production!')
}

export const signAuthToken = (payload) => jwt.sign(payload, secret, { expiresIn })

export const verifyAuthToken = (token) => jwt.verify(token, secret)

// Utility to generate a secure secret for production
export const generateSecureSecret = () => crypto.randomBytes(64).toString('hex')
