import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';

function isAdmin(role: string) {
  return role === 'admin' || role === 'super_admin';
}

async function getEventOrganizerId(eventId: string) {
  return queryOne<{ organizerId: string }>(
    `SELECT organizer_id as "organizerId" FROM scientific_events WHERE id = $1`,
    [eventId]
  );
}

async function isOrganizerOrAdmin(eventId: string, userId: string, role: string) {
  if (isAdmin(role)) return true;

  const event = await getEventOrganizerId(eventId);
  return !!event && event.organizerId === userId;
}

async function canView(eventId: string, userId: string, role: string) {
  if (isAdmin(role)) return true;

  const access = await queryOne(
    `SELECT 1
     FROM scientific_events se
     WHERE se.id = $1
       AND (
         se.organizer_id = $2
         OR EXISTS (
           SELECT 1 FROM event_organizers eo
           WHERE eo.event_id = se.id AND eo.user_id = $2
         )
       )`,
    [eventId, userId]
  );

  return !!access;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await canView(id, decoded.userId, decoded.role);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const organizers = await query(
      `SELECT
         eo.user_id as "userId",
         eo.role,
         u.first_name as "firstName",
         u.last_name as "lastName",
         u.email
       FROM event_organizers eo
       LEFT JOIN users u ON eo.user_id = u.id
       WHERE eo.event_id = $1
       ORDER BY eo.created_at ASC`,
      [id]
    );

    return NextResponse.json({ organizers });
  } catch (error) {
    console.error('GET event organizers error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await isOrganizerOrAdmin(id, decoded.userId, decoded.role);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const userId = body.userId ?? body.user_id;
    const role = body.role ?? 'Co-organizer';

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    const inserted = await queryOne(
      `INSERT INTO event_organizers (event_id, user_id, role, created_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (event_id, user_id) DO UPDATE SET role = EXCLUDED.role
       RETURNING id, event_id as "eventId", user_id as "userId", role, created_at as "createdAt"`,
      [id, userId, role]
    );

    return NextResponse.json(inserted, { status: 201 });
  } catch (error) {
    console.error('POST event organizer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const allowed = await isOrganizerOrAdmin(id, decoded.userId, decoded.role);
    if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await request.json().catch(() => ({} as any));
    const userId = body.userId ?? body.user_id;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Prevent removing the main organizer record via this endpoint.
    const event = await getEventOrganizerId(id);
    if (event?.organizerId === userId) {
      return NextResponse.json(
        { error: 'Cannot remove main organizer via organizers endpoint' },
        { status: 400 }
      );
    }

    await execute(
      'DELETE FROM event_organizers WHERE event_id = $1 AND user_id = $2',
      [id, userId]
    );

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE event organizer error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
