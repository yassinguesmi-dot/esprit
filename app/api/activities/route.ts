import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { createDemoActivity, isDemoUser, listDemoActivities, mapActivityToClient } from '@/lib/demo-store';

export async function GET(request: NextRequest) {
  try {
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
      return NextResponse.json({ activities: listDemoActivities(decoded.userId) });
    }

    // Get user activities
    const activities = await query(
      `SELECT 
        a.id, 
        a.type_activite as type,
        a.date_debut as startDate,
        a.date_fin as endDate,
        a.description,
        a.details,
        a.statut as status,
        a.date_creation as createdAt,
        (SELECT COUNT(*) FROM validations WHERE activite_id = a.id) as validationCount
      FROM activites a
      WHERE a.utilisateur_id = $1
      ORDER BY a.date_creation DESC`,
      [decoded.userId]
    );

    return NextResponse.json({ activities: activities.map(mapActivityToClient) });
  } catch (error) {
    console.error('GET activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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
    const details = {
      ...(body.details || {}),
      titre,
      heures,
    };

    if (!type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (isDemoUser(decoded.userId)) {
      const activity = createDemoActivity(decoded.userId, {
        titre,
        typeActivite: type,
        dateDebut: startDate,
        dateFin: endDate,
        heures,
        description,
      });

      return NextResponse.json(activity, { status: 201 });
    }

    // Create activity
    const activity = await queryOne(
      `INSERT INTO activites 
      (utilisateur_id, type_activite, date_debut, date_fin, description, details, statut, date_creation)
      VALUES ($1, $2, $3, $4, $5, $6, 'submitted', NOW())
      RETURNING id, type_activite as type, date_debut as startDate, date_fin as endDate, 
                description, details, statut as status, date_creation as createdAt`,
      [decoded.userId, type, startDate, endDate, description, JSON.stringify(details || {})]
    );

    return NextResponse.json(mapActivityToClient(activity), { status: 201 });
  } catch (error) {
    console.error('POST activities error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
