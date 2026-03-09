import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import { isDemoUser, listDemoValidations, parseDetails, saveDemoValidation } from '@/lib/demo-store';

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

    if (isDemoUser(decoded.userId)) {
      return NextResponse.json({ activities: listDemoValidations(decoded.userId) });
    }

    // Get activities pending validation for this user's department
    const validations = await query(
      `SELECT 
        a.id as activityId,
        a.type_activite as type,
        a.description,
        a.details,
        a.date_debut as startDate,
        a.date_fin as endDate,
        a.statut as status,
        u.nom as userName,
        u.prenom as userFirstName,
        u.email as userEmail,
        v.id as validationId,
        v.statut as validationStatus,
        v.commentaire as comment,
        v.date_validation as validatedAt
      FROM activites a
      JOIN utilisateurs u ON a.utilisateur_id = u.id
      LEFT JOIN validations v ON a.id = v.activite_id AND v.niveau = 1
      WHERE a.statut = 'submitted'
        AND u.id != $1
      ORDER BY a.date_creation DESC`,
      [decoded.userId]
    );

    return NextResponse.json({
      activities: validations.map((item: any) => {
        const details = parseDetails(item.details);
        return {
          id: item.activityId,
          activityId: item.activityId,
          userName: [item.userFirstName, item.userName].filter(Boolean).join(' '),
          userEmail: item.userEmail,
          typeActivite: item.type,
          titre: details.titre || details.title || 'Activité académique',
          dateDebut: item.startDate,
          dateFin: item.endDate,
          description: item.description,
        };
      }),
    });
  } catch (error) {
    console.error('GET validations error:', error);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { activityId, status, comment } = await request.json();

    if (!activityId || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    if (isDemoUser(decoded.userId)) {
      const validation = saveDemoValidation(decoded.userId, activityId, status, comment);

      if (!validation) {
        return NextResponse.json(
          { error: 'Activity not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { message: 'Validation saved', validation },
        { status: 201 }
      );
    }

    // Get activity
    const activity = await queryOne(
      'SELECT id, utilisateur_id FROM activites WHERE id = $1',
      [activityId]
    );

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    // Create validation record
    const validation = await queryOne(
      `INSERT INTO validations 
      (activite_id, utilisateur_validateur_id, statut, commentaire, niveau, date_validation)
      VALUES ($1, $2, $3, $4, 1, NOW())
      RETURNING id, statut as status, commentaire as comment, date_validation as validatedAt`,
      [activityId, decoded.userId, status, comment || null]
    );

    // Update activity status
    const newActivityStatus = status === 'approved' ? 'validated' : 'rejected';
    await execute(
      'UPDATE activites SET statut = $1, date_modification = NOW() WHERE id = $2',
      [newActivityStatus, activityId]
    );

    // Create audit log
    await execute(
      `INSERT INTO audit_logs 
      (utilisateur_id, action, table_affectee, id_enregistrement, ancienne_valeur, nouvelle_valeur, date_action)
      VALUES ($1, 'VALIDATION', 'activites', $2, 'submitted', $3, NOW())`,
      [decoded.userId, activityId, newActivityStatus]
    );

    // Create notification for activity owner
    await execute(
      `INSERT INTO notifications 
      (utilisateur_id, type, titre, message, activite_id, date_creation)
      VALUES ($1, 'VALIDATION', 'Activité Validée', 
              CASE WHEN $2 = 'approved' THEN 'Votre activité a été approuvée' 
                   ELSE 'Votre activité a été rejetée' END,
              $3, NOW())`,
      [activity.utilisateur_id, status, activityId]
    );

    return NextResponse.json(
      { message: 'Validation saved', validation },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
