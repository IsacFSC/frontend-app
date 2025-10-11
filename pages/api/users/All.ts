import type { NextApiResponse } from 'next'
import prisma from '#lib/prisma'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'
import { hasAnyRole } from '../../../lib/roles'
import { Prisma } from '@prisma/client'

type UserQuery = {
  limit?: string;
  offset?: string;
  search?: string;
  active?: 'true' | 'false' | 'all';
  role?: string;
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // mirror backend: GET /users/All with optional query params
  if (req.method !== 'GET') return res.status(405).end()
  if (!hasAnyRole(req, ['ADMIN', 'LEADER', 'USER'])) return res.status(403).json({ error: 'Forbidden' })

  const { limit = '10', offset = '0', search, active, role } = req.query as UserQuery;

  const take = Number(limit) || 10
  const skip = Number(offset) || 0

  const filters: Prisma.UserWhereInput[] = [];
  if (search && String(search).trim() !== '') {
    filters.push({ OR: [{ name: { contains: String(search) } }, { email: { contains: String(search) } }] })
  }
  if (typeof active !== 'undefined' && active !== 'all') {
    filters.push({ active: active === 'true' })
  }
  if (typeof role !== 'undefined' && role !== 'all' && ['ADMIN', 'LEADER', 'USER'].includes(String(role))) {
    filters.push({ role: String(role) })
  }

  let whereClause: Prisma.UserWhereInput = {};
  if (filters.length === 1) whereClause = filters[0]
  else if (filters.length > 1) whereClause = { AND: filters }

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({ where: whereClause, take, skip, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where: whereClause }),
  ])

  return res.json({ users, total })
}

export default withCors(withAuth(handler))

