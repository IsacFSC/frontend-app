import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { hashPassword } from '@/lib/auth'; // Assuming hashPassword is in auth

// GET /api/users -> list users (roles: ADMIN, LEADER, USER)
export async function GET(req: Request) {
  const session = await auth();
  // any authenticated user can list
  if (!session?.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await prisma.user.findMany({ take: 50 });
  return NextResponse.json(users);
}

// POST /api/users -> create user (public, but admin can set role)
export async function POST(req: Request) {
  const session = await auth(); // We check session to see if an admin is making the call
  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const passwordHash = await hashPassword(password);

  let roleToSet = 'USER';
  if (session?.user?.role === 'ADMIN' && role) {
    roleToSet = role;
  }

  try {
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: roleToSet },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    // Most likely a unique constraint violation on email
    return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
  }
}
