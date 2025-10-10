import type { NextApiRequest } from 'next'
import { AuthenticatedRequest } from './withAuth';

export type Role = 'ADMIN' | 'LEADER' | 'USER'

export function hasAnyRole(req: NextApiRequest | AuthenticatedRequest, allowed: Role[]) {
  const user = (req as AuthenticatedRequest).user
  if (!user || !user.role) return false
  return allowed.includes(user.role as Role)
}
