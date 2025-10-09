import * as jwt from 'jsonwebtoken'
import * as bcrypt from 'bcryptjs'
import { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET || 'change-me'

// allow arbitrary claims (some code includes `avatar` key not present on User)
export function signToken(payload: Record<string, any>) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_TTL || '30d' })
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch (err) {
    return null
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
