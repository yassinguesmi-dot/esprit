import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, generateToken } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password, nom, prenom, role = 'enseignant' } = await request.json();

    // Validation
    if (!email || !password || !nom || !prenom) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
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

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const result = await queryOne<{ id: string }>(
      `INSERT INTO utilisateurs (email, mot_de_passe, nom, prenom, role, date_creation)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [email, passwordHash, nom, prenom, role]
    );

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate token
    const token = generateToken(result.id, email, role);

    return NextResponse.json(
      {
        message: 'User created successfully',
        token,
        user: { id: result.id, email, nom, prenom, role }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
