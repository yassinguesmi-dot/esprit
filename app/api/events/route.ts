import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { execute, query, queryOne } from '@/lib/db';

function isAdmin(role: string) {
  return role === 'admin' || role === 'super_admin';
}

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

    const events = isAdmin(decoded.role)
      ? await query(
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
             se.created_at as "createdAt",
             se.updated_at as "updatedAt"
           FROM scientific_events se
           ORDER BY se.event_date DESC`
        )
      : await query(
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
             se.created_at as "createdAt",
             se.updated_at as "updatedAt"
           FROM scientific_events se
           WHERE se.organizer_id = $1
              OR EXISTS (
                SELECT 1 FROM event_organizers eo
                WHERE eo.event_id = se.id AND eo.user_id = $1
              )
           ORDER BY se.event_date DESC`,
          [decoded.userId]
        );

    return NextResponse.json({ events });
  } catch (error) {
    console.error('GET events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const eventType = body.eventType ?? body.event_type;
    const title = body.title;
    const description = body.description ?? null;
    const eventDate = body.eventDate ?? body.event_date;
    const endDate = body.endDate ?? body.end_date ?? null;
    const location = body.location ?? null;
    const scope = body.scope ?? null;
    const participantsCount =
      body.participantsCount ?? body.participants_count ?? null;
    const websiteUrl = body.websiteUrl ?? body.website_url ?? null;

    if (!eventType || !title || !eventDate) {
      return NextResponse.json(
        { error: 'Missing required fields: eventType, title, eventDate' },
        { status: 400 }
      );
    }

    const created = await queryOne(
      `INSERT INTO scientific_events (
         event_type,
         title,
         description,
         event_date,
         end_date,
         location,
         organizer_id,
         scope,
         participants_count,
         website_url,
         status,
         created_at,
         updated_at
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'planned',NOW(),NOW())
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
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [
        eventType,
        title,
        description,
        eventDate,
        endDate,
        location,
        decoded.userId,
        scope,
        participantsCount,
        websiteUrl,
      ]
    );

    if (!created) {
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // Keep organizer in the many-to-many table as well.
    await execute(
      `INSERT INTO event_organizers (event_id, user_id, role, created_at)
       VALUES ($1, $2, 'Main Organizer', NOW())
       ON CONFLICT (event_id, user_id) DO NOTHING`,
      [created.id, decoded.userId]
    );

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('POST events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
