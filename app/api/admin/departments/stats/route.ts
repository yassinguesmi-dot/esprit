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
      // Get department statistics
      const statsResult = await client.query(`
        SELECT 
          d.id,
          d.name,
          COUNT(DISTINCT u.id) as total_teachers,
          COUNT(DISTINCT a.id) as total_activities,
          SUM(CASE WHEN a.status = 'approved' THEN 1 ELSE 0 END) as approved_activities,
          SUM(CASE WHEN a.status IN ('draft', 'submitted') THEN 1 ELSE 0 END) as pending_activities,
          SUM(COALESCE(a.hours_validated, 0)) as total_hours
        FROM departments d
        LEFT JOIN users u ON d.id = u.department_id
        LEFT JOIN activities a ON u.id = a.user_id
        GROUP BY d.id, d.name
        ORDER BY d.name
      `);

      const stats = statsResult.rows.map(row => ({
        departmentId: row.id,
        departmentName: row.name,
        totalTeachers: parseInt(row.total_teachers) || 0,
        totalActivities: parseInt(row.total_activities) || 0,
        approvedActivities: parseInt(row.approved_activities) || 0,
        pendingActivities: parseInt(row.pending_activities) || 0,
        totalHours: parseInt(row.total_hours) || 0,
        averageHours: row.total_teachers > 0 
          ? Math.round((parseInt(row.total_hours) || 0) / parseInt(row.total_teachers)) 
          : 0,
      }));

      return NextResponse.json({ departments: stats });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Department stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
