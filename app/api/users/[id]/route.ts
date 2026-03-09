import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { getDemoUserById, isDemoUser, updateDemoUser } from '@/lib/demo-store';

function canAccessProfile(requestUserId: string, currentUserId: string, role: string) {
  return requestUserId === currentUserId || role === 'admin' || role === 'super_admin';
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !canAccessProfile(id, decoded.userId, decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDemoUser(id)) {
      const user = getDemoUserById(id);
      return user
        ? NextResponse.json(user)
        : NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await queryOne(
      `SELECT id, email, nom, prenom, role, departement,
              date_creation as createdAt, derniere_connexion as lastLogin
       FROM utilisateurs
       WHERE id = $1`,
      [id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('GET user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !canAccessProfile(id, decoded.userId, decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const payload = {
      nom: body.nom,
      prenom: body.prenom,
      departement: body.departement,
    };

    if (isDemoUser(id)) {
      const user = updateDemoUser(id, payload);
      return user
        ? NextResponse.json(user)
        : NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = await queryOne(
      `UPDATE utilisateurs
       SET nom = $1,
           prenom = $2,
           departement = $3,
           date_modification = NOW()
       WHERE id = $4
       RETURNING id, email, nom, prenom, role, departement,
                 date_creation as createdAt, derniere_connexion as lastLogin`,
      [payload.nom, payload.prenom, payload.departement || null, id]
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
