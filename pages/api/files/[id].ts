import type { NextApiRequest, NextApiResponse } from 'next'
import prisma from '../../../lib/prisma'
import withCors from '../../../lib/withCors'
import withAuth from '../../../lib/withAuth'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  const file = await prisma.file.findUnique({ where: { id: Number(id) } })
  if (!file) return res.status(404).json({ error: 'File not found' })
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`)
  res.send(file.data as any)
}

export default withCors(withAuth(handler))

