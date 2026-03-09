import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

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

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';
    const action = searchParams.get('action');

    let query_str = `SELECT 
      al.id,
      al.utilisateur_id as userId,
      u.prenom as userFirstName,
      u.nom as userName,
      al.action,
      al.table_affectee as tableAffected,
      al.id_enregistrement as recordId,
      al.ancienne_valeur as oldValue,
      al.nouvelle_valeur as newValue,
      al.date_action as actionDate
    FROM audit_logs al
    JOIN utilisateurs u ON al.utilisateur_id = u.id
    WHERE al.date_action > NOW() - INTERVAL '${days} days'`;

    const params: any[] = [];

    if (action) {
      query_str += ` AND al.action = $${params.length + 1}`;
      params.push(action);
    }

    query_str += ' ORDER BY al.date_action DESC LIMIT 1000';

    const logs = await query(query_str, params);

    return NextResponse.json(logs);
  } catch (error) {
    console.error('GET audit logs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
