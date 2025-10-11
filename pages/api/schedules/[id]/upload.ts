import type { NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth, { AuthenticatedRequest } from '#lib/withAuth'
import prisma from '#lib/prisma'
import formidable, { File, Fields, Files } from 'formidable'
import fs from 'fs/promises'

export const config = { api: { bodyParser: false } }

export default withCors(
  withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== 'POST') return res.status(405).end()
    const scheduleId = Number(req.query.id)
    if (isNaN(scheduleId)) return res.status(400).json({ error: 'Invalid schedule id' })

    const form = new formidable.IncomingForm()
    form.parse(req, async (err: Error, fields: Fields, files: Files) => {
      if (err) {
        console.error('Formidable error:', err)
        return res.status(400).json({ error: 'Upload error' })
      }

      const uploadedFile = files.file
      if (!uploadedFile || Array.isArray(uploadedFile)) {
        return res.status(400).json({ error: 'Please upload a single file named "file".' })
      }
      const file: File = uploadedFile

      const filePath = file.filepath
      if (!filePath) return res.status(400).json({ error: 'Uploaded file not found on server' })

      let convoId: number | null = null
      try {
        const buffer = await fs.readFile(filePath)
        const fileExt = (file.originalFilename || 'bin').split('.').pop() || 'bin'
        const fileName = `schedule-${scheduleId}.${fileExt}`

        const createdFile = await prisma.file.create({
          data: {
            fileName,
            mimeType: file.mimetype || 'application/octet-stream',
            data: buffer,
            size: file.size,
          },
        })

        const updated = await prisma.schedule.update({
          where: { id: scheduleId },
          data: { fileId: createdFile.id },
          include: { users: { include: { user: true } }, tasks: true },
        })

        // Create or reuse a group conversation for this schedule so all schedule users can discuss the attached file
        const uploaderId = Number(req.user?.id)
        const scheduleName = updated.name || `Escala ${scheduleId}`
        const scheduleDate = new Date(updated.startTime).toLocaleDateString('pt-BR')
        const subject = `Anexo da Escala - ${scheduleName} - ${scheduleDate}`

        const participantIds = (updated.users || []).map(u => u.userId).filter((id): id is number => id !== null)
        if (uploaderId && !participantIds.includes(uploaderId)) {
          participantIds.push(uploaderId)
        }

        let convo = await prisma.conversation.findFirst({ where: { subject } })
        if (!convo) {
          convo = await prisma.conversation.create({
            data: { subject, participants: { connect: participantIds.map(id => ({ id })) } },
            include: { participants: true },
          })
        }

        if (convo) {
          const authorFallback = participantIds.length > 0 ? participantIds[0] : undefined
          await prisma.message.create({
            data: {
              content: `Arquivo anexado à escala: ${fileName}`,
              authorId: uploaderId || authorFallback || 0,
              conversationId: convo.id,
              fileId: createdFile.id,
            },
          })
          convoId = convo.id
        }

        return res.json({ schedule: updated, conversationId: convoId })
      } catch (error) {
        console.error('Error processing file or creating conversation:', error)
        return res.status(500).json({ error: 'Internal server error' })
      } finally {
        if (filePath) {
          fs.unlink(filePath).catch(console.error)
        }
      }
    })
  }),
)