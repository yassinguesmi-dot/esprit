import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { isDemoUser, updateDemoUser } from '@/lib/demo-store';

function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

const ALLOWED_ROLES = new Set(['enseignant', 'chef_departement', 'admin', 'super_admin']);

export async function PATCH(
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
    if (!decoded || !isAdmin(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const role = body.role as string | undefined;
    const departement = body.departement as string | undefined;
    const nom = body.nom as string | undefined;
    const prenom = body.prenom as string | undefined;

    if (!role && !departement && !nom && !prenom) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    if (role && !ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    if (isDemoUser(id)) {
      const updated = updateDemoUser(id, { nom, prenom, departement, role });
      return updated
        ? NextResponse.json(updated)
        : NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await queryOne(
      `UPDATE utilisateurs
       SET nom = COALESCE($1, nom),
           prenom = COALESCE($2, prenom),
           departement = COALESCE($3, departement),
           role = COALESCE($4, role),
           date_modification = NOW()
       WHERE id = $5
       RETURNING id, email, nom, prenom, role, departement,
                 date_creation as createdAt, derniere_connexion as lastLogin`,
      [nom ?? null, prenom ?? null, departement ?? null, role ?? null, id]
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await execute(
      `INSERT INTO audit_logs
       (utilisateur_id, action, table_affectee, id_enregistrement, nouvelle_valeur, date_action)
       VALUES ($1, 'MAJ_UTILISATEUR', 'utilisateurs', $2, $3, NOW())`,
      [decoded.userId, id, JSON.stringify({ role, departement, nom, prenom })]
    );

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('PATCH admin user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
