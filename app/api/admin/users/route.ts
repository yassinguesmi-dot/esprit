import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import { createDemoUser, isDemoUser, listDemoUsers } from '@/lib/demo-store';

// Helper to check admin role
function isAdmin(role: string): boolean {
  return role === 'admin' || role === 'super_admin';
}

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
      return NextResponse.json(listDemoUsers());
    }

    // Get all users
    const users = await query(
      `SELECT 
        id,
        email,
        nom,
        prenom,
        role,
        departement,
        date_creation as createdAt,
        derniere_connexion as lastLogin
      FROM utilisateurs
      ORDER BY date_creation DESC`
    );

    return NextResponse.json(users);
  } catch (error) {
    console.error('GET users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || !isAdmin(decoded.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, nom, prenom, role, departement } = await request.json();

    if (!email || !nom || !prenom || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (isDemoUser(decoded.userId)) {
      try {
        const result = createDemoUser({ email, nom, prenom, role, departement });
        return NextResponse.json(result, { status: 201 });
      } catch (error) {
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'User already exists' },
          { status: 400 }
        );
      }
    }

    // Check if user exists
    const existingUser = await queryOne(
      'SELECT id FROM utilisateurs WHERE email = $1',
      [email]
    );

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    // Create temporary password
    const tempPassword = Math.random().toString(36).slice(-8);

    // Create user
    const user = await queryOne(
      `INSERT INTO utilisateurs 
      (email, mot_de_passe, nom, prenom, role, departement, date_creation)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING id, email, nom, prenom, role, departement, date_creation as createdAt`,
      [email, tempPassword, nom, prenom, role, departement || null]
    );

    // Create audit log
    await execute(
      `INSERT INTO audit_logs 
      (utilisateur_id, action, table_affectee, id_enregistrement, nouvelle_valeur, date_action)
      VALUES ($1, 'CREATION_UTILISATEUR', 'utilisateurs', $2, $3, NOW())`,
      [decoded.userId, user.id, JSON.stringify(user)]
    );

    return NextResponse.json(
      { user, tempPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
