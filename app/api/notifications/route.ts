import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    // Get notifications
    let query_str = `SELECT 
      id,
      utilisateur_id as userId,
      type,
      titre,
      message,
      activite_id as activityId,
      lu as read,
      date_creation as createdAt
    FROM notifications
    WHERE utilisateur_id = $1`;

    const params: any[] = [decoded.userId];

    if (unreadOnly) {
      query_str += ' AND lu = false';
    }

    query_str += ' ORDER BY date_creation DESC LIMIT 50';

    const notifications = await query(query_str, params);

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('GET notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationId, read } = await request.json();

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Update notification
    await execute(
      `UPDATE notifications 
      SET lu = $1, date_lecture = NOW()
      WHERE id = $2 AND utilisateur_id = $3`,
      [read, notificationId, decoded.userId]
    );

    return NextResponse.json({ message: 'Notification updated' });
  } catch (error) {
    console.error('PUT notification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
