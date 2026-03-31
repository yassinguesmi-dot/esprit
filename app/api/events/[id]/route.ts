import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';

function isAdmin(role: string) {
  return role === 'admin' || role === 'super_admin';
}

async function canAccessEvent(eventId: string, userId: string) {
  const row = await queryOne(
    `SELECT
       se.organizer_id as "organizerId",
       (se.organizer_id = $2) as "isOrganizer",
       EXISTS (
         SELECT 1 FROM event_organizers eo
         WHERE eo.event_id = se.id AND eo.user_id = $2
       ) as "isCoOrganizer"
     FROM scientific_events se
     WHERE se.id = $1`,
    [eventId, userId]
  );

  return row ? { exists: true, ...row } : { exists: false };
}

export async function GET(
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

    const access = await canAccessEvent(id, decoded.userId);
    if (!access.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!isAdmin(decoded.role) && !access.isOrganizer && !access.isCoOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await queryOne(
      `SELECT
         se.id,
         se.event_type as "eventType",
         se.title,
         se.description,
         se.event_date as "eventDate",
         se.end_date as "endDate",
         se.location,
         se.scope,
         se.participants_count as "participantsCount",
         se.website_url as "websiteUrl",
         se.status,
         se.organizer_id as "organizerId",
         se.validated_by as "validatedBy",
         se.validation_date as "validationDate",
         se.created_at as "createdAt",
         se.updated_at as "updatedAt"
       FROM scientific_events se
       WHERE se.id = $1`,
      [id]
    );

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

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

    return NextResponse.json({ ...event, organizers });
  } catch (error) {
    console.error('GET event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const access = await canAccessEvent(id, decoded.userId);
    if (!access.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!isAdmin(decoded.role) && !access.isOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const eventType = body.eventType ?? body.event_type ?? null;
    const title = body.title ?? null;
    const description = body.description ?? null;
    const eventDate = body.eventDate ?? body.event_date ?? null;
    const endDate = body.endDate ?? body.end_date ?? null;
    const location = body.location ?? null;
    const scope = body.scope ?? null;
    const participantsCount = body.participantsCount ?? body.participants_count ?? null;
    const websiteUrl = body.websiteUrl ?? body.website_url ?? null;
    const status = body.status ?? null;

    const updated = await queryOne(
      `UPDATE scientific_events
       SET event_type = COALESCE($1, event_type),
           title = COALESCE($2, title),
           description = COALESCE($3, description),
           event_date = COALESCE($4, event_date),
           end_date = COALESCE($5, end_date),
           location = COALESCE($6, location),
           scope = COALESCE($7, scope),
           participants_count = COALESCE($8, participants_count),
           website_url = COALESCE($9, website_url),
           status = COALESCE($10, status),
           updated_at = NOW()
       WHERE id = $11
       RETURNING
         id,
         event_type as "eventType",
         title,
         description,
         event_date as "eventDate",
         end_date as "endDate",
         location,
         scope,
         participants_count as "participantsCount",
         website_url as "websiteUrl",
         status,
         organizer_id as "organizerId",
         validated_by as "validatedBy",
         validation_date as "validationDate",
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [
        eventType,
        title,
        description,
        eventDate,
        endDate,
        location,
        scope,
        participantsCount,
        websiteUrl,
        status,
        id,
      ]
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('PATCH event error:', error);
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
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const access = await canAccessEvent(id, decoded.userId);
    if (!access.exists) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!isAdmin(decoded.role) && !access.isOrganizer) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await execute('DELETE FROM scientific_events WHERE id = $1', [id]);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('DELETE event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
