import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { execute, queryOne } from '@/lib/db';
import { deleteDemoReport, isDemoUser } from '@/lib/demo-store';

export async function DELETE(
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
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDemoUser(decoded.userId)) {
      const deleted = deleteDemoReport(decoded.userId, id);

      if (!deleted) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Report deleted' });
    }

    const existing = await queryOne(
      'SELECT id FROM rapports WHERE id = $1 AND utilisateur_id = $2',
      [id, decoded.userId]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    await execute('DELETE FROM rapports WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Report deleted' });
  } catch (error) {
    console.error('DELETE report error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
