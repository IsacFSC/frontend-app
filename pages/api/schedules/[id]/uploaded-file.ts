import type { NextApiRequest, NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import prisma from '#lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const scheduleId = Number(req.query.id)
  if (isNaN(scheduleId)) return res.status(400).json({ error: 'Invalid schedule id' })

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId }, include: { file: true } })
  if (!schedule || !schedule.fileId) return res.status(404).json({ error: 'No file attached' })
  const file = await prisma.file.findUnique({ where: { id: schedule.fileId } })
  if (!file) return res.status(404).json({ error: 'File not found' })
  res.setHeader('Content-Type', file.mimeType || 'application/octet-stream')
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`)
  res.send(file.data)
}

export default withCors(withAuth(handler))
