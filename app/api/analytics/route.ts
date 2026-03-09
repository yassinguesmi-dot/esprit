import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { verifyToken } from '@/lib/auth';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const client = await pool.connect();

    try {
      // Get total activities
      const activitiesResult = await client.query(
        'SELECT COUNT(*) as count FROM activities WHERE user_id = $1',
        [payload.userId]
      );

      // Get approved activities
      const approvedResult = await client.query(
        'SELECT COUNT(*) as count FROM activities WHERE user_id = $1 AND status = $2',
        [payload.userId, 'approved']
      );

      // Get pending activities
      const pendingResult = await client.query(
        'SELECT COUNT(*) as count FROM activities WHERE user_id = $1 AND status IN ($2, $3)',
        [payload.userId, 'draft', 'submitted']
      );

      // Get total hours
      const hoursResult = await client.query(
        'SELECT SUM(hours_validated) as total FROM activities WHERE user_id = $1 AND status = $2',
        [payload.userId, 'approved']
      );

      // Get activities by type
      const typeResult = await client.query(`
        SELECT at.name, COUNT(*) as count 
        FROM activities a 
        JOIN activity_types at ON a.activity_type_id = at.id 
        WHERE a.user_id = $1 
        GROUP BY at.name
      `, [payload.userId]);

      const totalActivities = parseInt(activitiesResult.rows[0].count) || 0;
      const approvedActivities = parseInt(approvedResult.rows[0].count) || 0;
      const pendingActivities = parseInt(pendingResult.rows[0].count) || 0;
      const totalHours = parseInt(hoursResult.rows[0].total) || 0;
      const averageHoursPerActivity = totalActivities > 0 ? Math.round(totalHours / totalActivities) : 0;

      const activitiesByType: Record<string, number> = {};
      typeResult.rows.forEach(row => {
        activitiesByType[row.name] = parseInt(row.count);
      });

      return NextResponse.json({
        totalActivities,
        approvedActivities,
        pendingActivities,
        totalHours,
        averageHoursPerActivity,
        activitiesByType,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
