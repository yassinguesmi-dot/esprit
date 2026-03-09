import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, generateToken } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { validateDemoCredentials } from '@/lib/demo-store';

interface User {
  id: string;
  email: string;
  mot_de_passe: string;
  nom: string;
  prenom: string;
  role: string;
}

export async function POST(request: NextRequest) {
  let credentials: { email?: string; password?: string } = {};

  try {
    credentials = await request.json();
    const { email, password } = credentials;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const demoUser = validateDemoCredentials(email, password);
    if (demoUser) {
      const token = generateToken(demoUser.id, demoUser.email, demoUser.role);

      return NextResponse.json({
        message: 'Login successful (demo mode)',
        token,
        user: demoUser,
        mode: 'demo',
      });
    }

    // Find user
    const user = await queryOne<User>(
      'SELECT id, email, mot_de_passe, nom, prenom, role FROM utilisateurs WHERE email = $1',
      [email]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.mot_de_passe);
    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Update last login
    await queryOne(
      'UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id = $1',
      [user.id]
    );

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);

    if (typeof error === 'object' && error && 'code' in error) {
      const code = String((error as { code?: unknown }).code ?? '');

      if (code === '28P01' || code === 'ECONNREFUSED' || code === '3D000') {
        return NextResponse.json(
          {
            error: 'Connexion base de données indisponible. Utilisez un compte de test ou corrigez DATABASE_URL.',
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erreur interne du service de connexion' },
      { status: 500 }
    );
  }
}
