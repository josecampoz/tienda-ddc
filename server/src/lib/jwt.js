import jwt from 'jsonwebtoken'

const secret = process.env.JWT_SECRET || 'dev-secret'
const expiresIn = process.env.JWT_EXPIRES_IN || '8h'

export const signAuthToken = (payload) => jwt.sign(payload, secret, { expiresIn })

export const verifyAuthToken = (token) => jwt.verify(token, secret)
