import type { NextApiRequest, NextApiResponse } from 'next'
import withCors from '#lib/withCors'
import withAuth from '#lib/withAuth'
import prisma from '#lib/prisma'
import { generateSchedulePDF } from '#lib/pdf.utils'

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).end()
  }

  const scheduleId = Number(req.query.id)
  if (isNaN(scheduleId)) {
    return res.status(400).json({ error: 'Invalid schedule id' })
  }

  try {
    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: {
        tasks: true,
        users: {
          include: {
            user: true,
          },
        },
      },
    })

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    const pdfBuffer = await generateSchedulePDF(schedule)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="escala-${schedule.name}.pdf"`)
    res.send(pdfBuffer)
  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({ error: 'Error generating PDF' })
  }
}

export default withCors(withAuth(handler))
