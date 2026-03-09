import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken } from '@/lib/auth';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { year } = await request.json();

    const client = await pool.connect();

    try {
      // Fetch activities
      const activitiesResult = await client.query(`
        SELECT 
          a.title,
          at.name as type,
          a.start_date,
          a.end_date,
          a.hours_declared,
          a.hours_validated,
          a.status,
          a.created_at
        FROM activities a
        JOIN activity_types at ON a.activity_type_id = at.id
        WHERE a.user_id = $1 
        AND EXTRACT(YEAR FROM a.created_at) = $2
        ORDER BY a.created_at DESC
      `, [payload.userId, year || new Date().getFullYear()]);

      // Generate CSV content
      const headers = ['Titre', 'Type', 'Date Début', 'Date Fin', 'Heures Déclarées', 'Heures Validées', 'Statut', 'Date Création'];
      const rows = activitiesResult.rows.map(row => [
        row.title,
        row.type,
        row.start_date,
        row.end_date || '',
        row.hours_declared || '',
        row.hours_validated || '',
        row.status,
        new Date(row.created_at).toLocaleDateString('fr-FR'),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="activites_${year || new Date().getFullYear()}.csv"`,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
