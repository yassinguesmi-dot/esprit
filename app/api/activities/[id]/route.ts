import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne, execute } from '@/lib/db';
import { deleteDemoActivity, getDemoActivity, isDemoUser, mapActivityToClient, updateDemoActivity } from '@/lib/demo-store';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (isDemoUser(decoded.userId)) {
      const activity = getDemoActivity(decoded.userId, id);

      if (!activity) {
        return NextResponse.json(
          { error: 'Activity not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(activity);
    }

    // Get activity (verify ownership)
    const activity = await queryOne(
      `SELECT 
        id,
        utilisateur_id as userId,
        type_activite as type,
        date_debut as startDate,
        date_fin as endDate,
        description,
        details,
        statut as status,
        date_creation as createdAt,
        date_modification as updatedAt
      FROM activites
      WHERE id = $1 AND utilisateur_id = $2`,
      [params.id, decoded.userId]
    );

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapActivityToClient(activity));
  } catch (error) {
    console.error('GET activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const type = body.typeActivite || body.type;
    const startDate = body.dateDebut || body.startDate;
    const endDate = body.dateFin || body.endDate || startDate;
    const description = body.description || '';
    const titre = body.titre || body.title;
    const heures = Number(body.heures ?? body.hours ?? 0);

    if (isDemoUser(decoded.userId)) {
      const activity = updateDemoActivity(decoded.userId, id, {
        titre,
        typeActivite: type,
        dateDebut: startDate,
        dateFin: endDate,
        heures,
        description,
      });

      if (!activity) {
        return NextResponse.json(
          { error: 'Activity not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(activity);
    }

    // Verify ownership
    const existing = await queryOne(
      'SELECT id FROM activites WHERE id = $1 AND utilisateur_id = $2',
      [id, decoded.userId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    const details = {
      ...(body.details || {}),
      titre,
      heures,
    };

    const activity = await queryOne(
      `UPDATE activites
      SET type_activite = $1,
          date_debut = $2,
          date_fin = $3,
          description = $4,
          details = $5,
          statut = CASE WHEN statut = 'rejected' THEN 'submitted' ELSE statut END,
          date_modification = NOW()
      WHERE id = $6
      RETURNING id, type_activite as type, date_debut as startDate, date_fin as endDate,
                description, details, statut as status, date_modification as updatedAt`,
      [type, startDate, endDate, description, JSON.stringify(details || {}), id]
    );

    return NextResponse.json(mapActivityToClient(activity));
  } catch (error) {
    console.error('PUT activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (isDemoUser(decoded.userId)) {
      const deleted = deleteDemoActivity(decoded.userId, id);

      if (!deleted) {
        return NextResponse.json(
          { error: 'Activity not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ message: 'Activity deleted' });
    }

    // Verify ownership
    const existing = await queryOne(
      'SELECT id FROM activites WHERE id = $1 AND utilisateur_id = $2',
      [id, decoded.userId]
    );

    if (!existing) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    await execute('DELETE FROM activites WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Activity deleted' });
  } catch (error) {
    console.error('DELETE activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
