import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hashPassword } from '@/lib/auth'; // Assuming hashPassword is in auth

// Defina uma interface para os dados de atualização do usuário
interface UserUpdateData {
  name?: string;
  email?: string;
  passwordHash?: string;
  role?: string;
  active?: boolean;
}

// GET /api/users/:id -> get user (ADMIN, LEADER, or self)
export async function GET(
  req: Request, // Parâmetro não utilizado
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const userId = Number(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const hasAccess = session?.user?.role === 'ADMIN' || 
                    session?.user?.role === 'LEADER' || 
                    session?.user?.id === userId;

  if (!hasAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT /api/users/:id -> update user (ADMIN or self)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;
  const userId = Number(id);

  if (isNaN(userId)) {
    return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
  }

  const isOwner = session?.user?.id === userId;
  const isAdmin = session?.user?.role === 'ADMIN';

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role, active } = body;

  const data: UserUpdateData = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.passwordHash = await hashPassword(password);

  // Only admin can change role and active status
  if (isAdmin) {
    if (role) data.role = role;
    if (typeof active === 'boolean') data.active = active;
  }

  try {
    const user = await prisma.user.update({ where: { id: userId }, data });
    return NextResponse.json(user);
  } catch (_error) {
    return NextResponse.json({ error: 'User not found or update failed' }, { status: 404 });
  }
}

// DELETE /api/users/:id -> delete user (ADMIN only)
export async function DELETE(
  _req: Request, // Parâmetro não utilizado
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

  try {
    await prisma.user.delete({ where: { id: userId } });
    return new NextResponse(null, { status: 204 });
  } catch (_error) {
    return NextResponse.json({ error: 'User not found or delete failed' }, { status: 404 });
  }
}
