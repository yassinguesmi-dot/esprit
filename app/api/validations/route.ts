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

    const isChef = decoded.role === 'chef_departement';
    const isAdmin = decoded.role === 'admin' || decoded.role === 'super_admin';

    if (!isChef && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (isDemoUser(decoded.userId)) {
      return NextResponse.json({ activities: listDemoValidations(decoded.userId, decoded.role) });
    }

    const expectedStatus = isChef ? 'submitted' : 'validated';
    const validationLevel = isChef ? 1 : 2;

    // Get activities pending validation for this user role
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
      LEFT JOIN validations v ON a.id = v.activite_id AND v.niveau = $2
      WHERE a.statut = $3
        AND u.id != $1
      ORDER BY a.date_creation DESC`,
      [decoded.userId, validationLevel, expectedStatus]
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

    const isChef = decoded.role === 'chef_departement';
    const isAdmin = decoded.role === 'admin' || decoded.role === 'super_admin';

    if (!isChef && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      'SELECT id, utilisateur_id, statut FROM activites WHERE id = $1',
      [activityId]
    );

    if (!activity) {
      return NextResponse.json(
        { error: 'Activity not found' },
        { status: 404 }
      );
    }

    if (activity.utilisateur_id === decoded.userId) {
      return NextResponse.json(
        { error: 'Cannot validate your own activity' },
        { status: 403 }
      );
    }

    const validationLevel = isChef ? 1 : 2;
    const expectedCurrentStatus = isChef ? 'submitted' : 'validated';

    if (activity.statut !== expectedCurrentStatus) {
      return NextResponse.json(
        { error: `Activity must be '${expectedCurrentStatus}' to validate at this level` },
        { status: 400 }
      );
    }

    // Create validation record
    const validation = await queryOne(
      `INSERT INTO validations 
      (activite_id, utilisateur_validateur_id, statut, commentaire, niveau, date_validation)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, statut as status, commentaire as comment, date_validation as validatedAt`,
      [activityId, decoded.userId, status, comment || null, validationLevel]
    );

    // Update activity status
    const newActivityStatus = status === 'approved'
      ? (isChef ? 'validated' : 'approved')
      : 'rejected';
    await execute(
      'UPDATE activites SET statut = $1, date_modification = NOW() WHERE id = $2',
      [newActivityStatus, activityId]
    );

    // Create audit log
    await execute(
      `INSERT INTO audit_logs 
      (utilisateur_id, action, table_affectee, id_enregistrement, ancienne_valeur, nouvelle_valeur, date_action)
      VALUES ($1, $2, 'activites', $3, $4, $5, NOW())`,
      [
        decoded.userId,
        validationLevel === 1 ? 'VALIDATION_N1' : 'VALIDATION_N2',
        activityId,
        activity.statut,
        newActivityStatus,
      ]
    );

    // Create notification for activity owner
    const notificationTitle = status === 'approved'
      ? (validationLevel === 1 ? 'Activité Validée' : 'Activité Approuvée')
      : 'Activité Rejetée';
    const notificationMessage = status === 'approved'
      ? (validationLevel === 1
          ? 'Votre activité a été validée par le chef de département'
          : 'Votre activité a été approuvée (validation finale)')
      : (validationLevel === 1
          ? 'Votre activité a été rejetée par le chef de département'
          : 'Votre activité a été rejetée lors de la validation finale');
    await execute(
      `INSERT INTO notifications 
      (utilisateur_id, type, titre, message, activite_id, date_creation)
      VALUES ($1, 'VALIDATION', $2, $3, $4, NOW())`,
      [activity.utilisateur_id, notificationTitle, notificationMessage, activityId]
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
