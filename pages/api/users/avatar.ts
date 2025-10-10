import type { NextApiRequest, NextApiResponse } from 'next'
import withCors from '../../../lib/withCors'
import withAuth, { AuthenticatedRequest } from '../../../lib/withAuth'
import prisma from '../../../lib/prisma'
import { signToken } from '../../../lib/auth'

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') return res.status(405).end()
  const userId = Number(req.user?.id)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const userRecord = await prisma.user.findUnique({ where: { id: userId } })
  if (!userRecord || !userRecord.avatarFileId) return res.status(400).json({ error: 'User has no avatar' })

  try {
    await prisma.file.delete({ where: { id: userRecord.avatarFileId } })
  } catch (_e) {
    // ignore
  }

  const updatedUser = await prisma.user.update({ where: { id: userId }, data: { avatarFileId: null }, select: { id: true, name: true, email: true, avatarFileId: true, role: true, createdAt: true, passwordHash: true, active: true } })
  const token = signToken({ id: updatedUser.id, email: updatedUser.email, role: updatedUser.role })
  return res.json({ user: updatedUser, token })
}

export default withCors(withAuth(handler))
