import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Defina uma interface para os dados de atualização do administrador
interface AdminUserUpdateData {
  role?: string;
  active?: boolean;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const body = await req.json();
  const { role, active } = body;

  const data: AdminUserUpdateData = {};
  if (role) data.role = role;
  if (typeof active === 'boolean') data.active = active;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });
    return NextResponse.json(user);
  } catch (_error) {
    return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
  }
}