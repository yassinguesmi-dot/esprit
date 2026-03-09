import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken } from '@/lib/auth';
import { calculateBonus, storeBonusCalculation } from '@/lib/bonus-calculator';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const year = request.nextUrl.searchParams.get('year');

    // Get primes for specific year or all if not specified
    let query = `SELECT * FROM primes WHERE id_enseignant = $1`;
    const params: any[] = [user.id];

    if (year) {
      query += ` AND annee_academique = $2`;
      params.push(year);
    }

    query += ` ORDER BY annee_academique DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json({
      primes: result.rows,
    });
  } catch (error) {
    console.error('Primes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch primes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { enseignantId, academicYear } = await request.json();

    if (!enseignantId || !academicYear) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Calculate bonus
    const calculation = await calculateBonus(enseignantId, academicYear, pool);

    // Store calculation
    const primeId = await storeBonusCalculation(
      enseignantId,
      academicYear,
      calculation.totalBonus,
      pool
    );

    return NextResponse.json({
      id: primeId,
      ...calculation,
    });
  } catch (error) {
    console.error('Primes calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate primes' },
      { status: 500 }
    );
  }
}
