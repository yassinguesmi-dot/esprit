import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { isDemoUser } from '@/lib/demo-store';

function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

const STATIC_ROLES = [
  {
    name: 'enseignant',
    label: 'Enseignant',
    description: 'Teaching staff member',
  },
  {
    name: 'chef_departement',
    label: 'Chef de Département',
    description: 'Department chief',
  },
  {
    name: 'admin',
    label: 'Administrateur',
    description: 'System administrator',
  },
  {
    name: 'super_admin',
    label: 'Super Admin',
    description: 'Super administrator with full access',
  },
];

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !isAdmin(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDemoUser(decoded.userId)) {
      return NextResponse.json({ roles: STATIC_ROLES });
    }

    // Prefer DB roles when available (english schema). If not present, fall back to static roles.
    try {
      const roles = await query(
        `SELECT id, name, description, permissions, created_at as "createdAt"
         FROM roles
         ORDER BY name`
      );

      return NextResponse.json({
        roles: roles.map((role: any) => ({
          ...role,
          label: role.name,
        })),
      });
    } catch (error) {
      console.warn('Roles table not available, returning static roles:', error);
      return NextResponse.json({ roles: STATIC_ROLES });
    }
  } catch (error) {
    console.error('GET admin roles error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
