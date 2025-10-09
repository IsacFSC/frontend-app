import type { NextApiHandler, NextApiRequest, NextApiResponse } from 'next'
import { verifyToken } from './auth'

export default function withAuth(handler: NextApiHandler) {
  return async function (req: NextApiRequest, res: NextApiResponse) {
    const auth = req.headers.authorization || ''
    const parts = auth.split(' ')
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' })
    }

    const token = parts[1]
    const payload = verifyToken(token)
    if (!payload) return res.status(401).json({ error: 'Invalid token' })

    // attach user info to request
    ;(req as any).user = payload
    return handler(req, res)
  }
}
