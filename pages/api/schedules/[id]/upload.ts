import type { NextApiRequest, NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import prisma from '#lib/prisma'
import formidable from 'formidable'
import fs from 'fs/promises'

export const config = { api: { bodyParser: false } }

export default withCors(withAuth(async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const scheduleId = Number(req.query.id)
  if (isNaN(scheduleId)) return res.status(400).json({ error: 'Invalid schedule id' })

  const form = new formidable.IncomingForm()
  form.parse(req as any, async (err: any, fields: any, files: any) => {
    if (err) return res.status(400).json({ error: 'Upload error' })
  const file = files.file as any
  const filePath = file.filepath || file.filePath || file.path
  if (!filePath) return res.status(400).json({ error: 'Uploaded file not found on server' })
  const buffer = await fs.readFile(filePath)
  const fileExt = (file.originalFilename || file.name || 'bin').split('.').pop() || 'bin'
    const fileName = `schedule-${scheduleId}.${fileExt}`

  const createdFile = await prisma.file.create({ data: { fileName, mimeType: file.mimetype || file.type || 'application/octet-stream', data: buffer, size: file.size || buffer.length || 0 } })
    const updated = await prisma.schedule.update({ where: { id: scheduleId }, data: { fileId: createdFile.id }, include: { users: { include: { user: true } }, tasks: true } })

  let convoId: number | null = null
  try {
      // Create or reuse a group conversation for this schedule so all schedule users can discuss the attached file
      const uploaderId = Number((req as any).user?.id)
      const scheduleName = updated.name || `Escala ${scheduleId}`
      const scheduleDate = new Date(updated.startTime).toLocaleDateString('pt-BR')
      const subject = `Anexo da Escala - ${scheduleName} - ${scheduleDate}`

      // collect participant ids from schedule users (hoisted so it's available below)
      const participantIds = (updated.users || []).map((u: any) => u.userId).filter((id: any) => typeof id === 'number')
      // Ensure uploader is included
      if (uploaderId && !participantIds.includes(uploaderId)) participantIds.push(uploaderId)

      // find if a conversation with the same subject already exists (avoid duplicate)
      let convo = await prisma.conversation.findFirst({ where: { subject } })
      if (!convo) {
        convo = await prisma.conversation.create({ data: { subject, participants: { connect: participantIds.map((id: number) => ({ id })) } }, include: { participants: true } })
      }

      // Create a message in the conversation with the uploaded file attached
      if (convo) {
        const authorFallback = participantIds.length > 0 ? participantIds[0] : undefined
        await prisma.message.create({ data: { content: `Arquivo anexado à escala: ${fileName}`, authorId: uploaderId || authorFallback || 0, conversationId: convo.id, fileId: createdFile.id } })
        // optionally, notify frontend via an event system (clients relying on polling/events will pick up new convo/message)
        convoId = convo.id
      }
    } catch (err) {
      console.error('Failed to create group conversation for schedule upload', err)
      // do not fail the upload itself; just log the error
    }

    return res.json({ schedule: updated, conversationId: convoId })
  })
}))
