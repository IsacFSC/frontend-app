import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import withCors from '../../../lib/withCors';
import withAuth from '../../../lib/withAuth';
import { hasAnyRole } from '../../../lib/roles';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasAnyRole(req, ['ADMIN'])) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const scheduleId = Number(req.query.id);
  if (isNaN(scheduleId)) {
    return res.status(400).json({ error: 'Invalid schedule ID' });
  }

  if (req.method === 'DELETE') {
    await prisma.schedule.delete({ where: { id: scheduleId } });
    return res.status(204).end();
  }

  if (req.method === 'PATCH') {
    try {
      const { users, ...scheduleData } = req.body;

      const updatedSchedule = await prisma.$transaction(async (tx) => {
        // Primeiro, atualiza os dados da escala (nome, descrição, etc.)
        const updated = await tx.schedule.update({
          where: { id: scheduleId },
          data: scheduleData,
        });

        // Se a lista de usuários foi enviada, atualiza a relação
        if (users && users.set) {
          // Deleta todos os usuários atuais da escala
          await tx.usersOnSchedules.deleteMany({ where: { scheduleId } });
          // Cria as novas conexões
          await tx.usersOnSchedules.createMany({
            data: users.set.map((u: { userId: number; skill: string }) => ({ ...u, scheduleId })),
          });
        }
        return updated;
      });
      return res.status(200).json({ ...updatedSchedule, users: users?.set || [] });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update schedule' });
    }
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

export default withCors(withAuth(handler));