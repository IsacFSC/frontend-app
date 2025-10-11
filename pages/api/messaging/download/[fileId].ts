import type { NextApiRequest, NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import prisma from '#lib/prisma'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { fileId } = req.query
  const asNumber = Number(fileId)
  let file
  if (!isNaN(asNumber) && String(asNumber) === String(fileId)) {
    file = await prisma.file.findUnique({ where: { id: asNumber } })
  } else {
    // try by fileName
    file = await prisma.file.findFirst({ where: { fileName: String(fileId) } })
  }
  if (!file) return res.status(404).json({ error: 'File not found' })
  // Ensure file.data is a Buffer
  const buffer = Buffer.isBuffer(file.data) ? file.data : Buffer.from(file.data)
  const mime = (file.mimeType || 'application/octet-stream').toLowerCase()
  res.setHeader('Content-Type', mime)
  // If it's an image, allow inline preview so <img src="..."> works. Otherwise force download.
  const dispositionType = mime.startsWith('image/') ? 'inline' : 'attachment'
  res.setHeader('Content-Disposition', `${dispositionType}; filename="${file.fileName}"`)
  res.setHeader('Content-Length', String(file.size || buffer.length))
  // Send binary response
  res.status(200)
  res.end(buffer)
}

export default withCors(withAuth(handler))
