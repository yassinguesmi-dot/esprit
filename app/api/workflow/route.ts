// API Route for Workflow and Validation Management
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// POST - Submit activity for validation
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
    const { activity_type, activity_id, action, comments } = body;

    // Validate required fields
    if (!activity_type || !activity_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: activity_type, activity_id, action' },
        { status: 400 }
      );
    }

    // Valid activity types and tables
    const activityTables: Record<string, string> = {
      teaching: 'teaching_activities',
      supervision: 'supervision_activities',
      research: 'research_publications',
      exam: 'exam_supervisions',
      responsibility: 'academic_responsibilities'
    };

    if (!activityTables[activity_type]) {
      return NextResponse.json(
        { error: 'Invalid activity type' },
        { status: 400 }
      );
    }

    const table = activityTables[activity_type];

    // Get current user role
    const currentUser = await queryOne(`
      SELECT u.id, r.name as role, u.department_id
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `, [decoded.userId]);

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Process action based on workflow
    let result;

    switch (action) {
      case 'submit':
        result = await handleSubmit(table, activity_id, activity_type, decoded.userId);
        break;

      case 'validate':
        result = await handleValidate(table, activity_id, activity_type, decoded.userId, currentUser, comments);
        break;

      case 'reject':
        result = await handleReject(table, activity_id, activity_type, decoded.userId, currentUser, comments);
        break;

      case 'request_revision':
        result = await handleRequestRevision(table, activity_id, activity_type, decoded.userId, currentUser, comments);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('POST workflow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get validation history for an activity
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
    const activityType = searchParams.get('activity_type');
    const activityId = searchParams.get('activity_id');

    if (!activityType || !activityId) {
      return NextResponse.json(
        { error: 'Missing activity_type or activity_id' },
        { status: 400 }
      );
    }

    // Get validation history
    const validations = await query(`
      SELECT 
        v.id,
        v.activity_id,
        v.validator_id,
        u.first_name || ' ' || u.last_name as validator_name,
        r.name as validator_role,
        ws.name as workflow_state,
        v.decision,
        v.comments,
        v.validation_date,
        v.created_at
      FROM validations v
      INNER JOIN users u ON v.validator_id = u.id
      INNER JOIN roles r ON u.role_id = r.id
      LEFT JOIN workflow_states ws ON v.workflow_state_id = ws.id
      WHERE v.activity_id = $1
      ORDER BY v.created_at DESC
    `, [activityId]);

    return NextResponse.json({ validations });

  } catch (error) {
    console.error('GET workflow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions

async function handleSubmit(table: string, activityId: string, activityType: string, userId: string) {
  // Check if activity belongs to user
  const activity = await queryOne(
    `SELECT user_id, status FROM ${table} WHERE id = $1`,
    [activityId]
  );

  if (!activity) {
    throw new Error('Activity not found');
  }

  if (activity.user_id !== userId) {
    throw new Error('Unauthorized to submit this activity');
  }

  if (activity.status !== 'draft') {
    throw new Error('Activity can only be submitted from draft status');
  }

  // Update activity status to pending
  await query(
    `UPDATE ${table} SET status = 'pending', updated_at = NOW() WHERE id = $1`,
    [activityId]
  );

  // Get submitted state
  const submittedState = await queryOne(
    `SELECT id FROM workflow_states WHERE name = 'submitted'`
  );

  // Create validation record
  await query(`
    INSERT INTO validations (activity_id, validator_id, workflow_state_id, decision, validation_date, created_at)
    VALUES ($1, $2, $3, 'submitted', NOW(), NOW())
  `, [activityId, userId, submittedState?.id]);

  // Get user's department head for notification
  const user = await queryOne(`SELECT department_id FROM users WHERE id = $1`, [userId]);

  if (user?.department_id) {
    // Notify department head
    await query(`
      INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
      SELECT 
        u.id,
        'activity_submitted',
        'Nouvelle activité à valider',
        'Une activité a été soumise et attend votre validation.',
        $1,
        $2,
        false
      FROM users u
      INNER JOIN roles r ON u.role_id = r.id
      WHERE u.department_id = $3 AND r.name = 'chef_departement'
    `, [activityType, activityId, user.department_id]);
  }

  return {
    success: true,
    status: 'pending',
    message: 'Activity submitted for validation'
  };
}

async function handleValidate(
  table: string,
  activityId: string,
  activityType: string,
  validatorId: string,
  currentUser: any,
  comments?: string
) {
  // Check if user has permission to validate
  if (!['chef_departement', 'admin', 'super_admin'].includes(currentUser.role)) {
    throw new Error('Insufficient permissions to validate activities');
  }

  // Get activity
  const activity = await queryOne(
    `SELECT user_id, status FROM ${table} WHERE id = $1`,
    [activityId]
  );

  if (!activity) {
    throw new Error('Activity not found');
  }

  if (activity.status !== 'pending') {
    throw new Error('Activity must be in pending status to validate');
  }

  // Update activity status and add validator
  await query(
    `UPDATE ${table} 
     SET status = 'validated', 
         validated_by = $2, 
         validation_date = NOW(), 
         updated_at = NOW() 
     WHERE id = $1`,
    [activityId, validatorId]
  );

  // Get validated state
  const validatedState = await queryOne(
    `SELECT id FROM workflow_states WHERE name = 'validated'`
  );

  // Create validation record
  await query(`
    INSERT INTO validations (activity_id, validator_id, workflow_state_id, decision, comments, validation_date, created_at)
    VALUES ($1, $2, $3, 'approved', $4, NOW(), NOW())
  `, [activityId, validatorId, validatedState?.id, comments || null]);

  // Notify activity owner
 await query(`
    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
    VALUES ($1, 'activity_validated', 'Activité validée', 'Votre activité a été validée.', $2, $3, false)
  `, [activity.user_id, activityType, activityId]);

  return {
    success: true,
    status: 'validated',
    message: 'Activity validated successfully'
  };
}

async function handleReject(
  table: string,
  activityId: string,
  activityType: string,
  validatorId: string,
  currentUser: any,
  comments?: string
) {
  // Check if user has permission to reject
  if (!['chef_departement', 'admin', 'super_admin'].includes(currentUser.role)) {
    throw new Error('Insufficient permissions to reject activities');
  }

  // Get activity
  const activity = await queryOne(
    `SELECT user_id, status FROM ${table} WHERE id = $1`,
    [activityId]
  );

  if (!activity) {
    throw new Error('Activity not found');
  }

  if (activity.status !== 'pending') {
    throw new Error('Activity must be in pending status to reject');
  }

  // Update activity status
  await query(
    `UPDATE ${table} 
     SET status = 'rejected', 
         validated_by = $2, 
         validation_date = NOW(), 
         updated_at = NOW() 
     WHERE id = $1`,
    [activityId, validatorId]
  );

  // Get rejected state
  const rejectedState = await queryOne(
    `SELECT id FROM workflow_states WHERE name = 'rejected'`
  );

  // Create validation record
  await query(`
    INSERT INTO validations (activity_id, validator_id, workflow_state_id, decision, comments, validation_date, created_at)
    VALUES ($1, $2, $3, 'rejected', $4, NOW(), NOW())
  `, [activityId, validatorId, rejectedState?.id, comments || 'Activity rejected']);

  // Notify activity owner
  await query(`
    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
    VALUES ($1, 'activity_rejected', 'Activité rejetée', $2, $3, $4, false)
  `, [activity.user_id, `Votre activité a été rejetée. ${comments || ''}`, activityType, activityId]);

  return {
    success: true,
    status: 'rejected',
    message: 'Activity rejected'
  };
}

async function handleRequestRevision(
  table: string,
  activityId: string,
  activityType: string,
  validatorId: string,
  currentUser: any,
  comments?: string
) {
  // Check if user has permission
  if (!['chef_departement', 'admin', 'super_admin'].includes(currentUser.role)) {
    throw new Error('Insufficient permissions to request revision');
  }

  // Get activity
  const activity = await queryOne(
    `SELECT user_id, status FROM ${table} WHERE id = $1`,
    [activityId]
  );

  if (!activity) {
    throw new Error('Activity not found');
  }

  if (activity.status !== 'pending') {
    throw new Error('Activity must be in pending status to request revision');
  }

  // Update activity status back to draft
  await query(
    `UPDATE ${table} 
     SET status = 'draft', 
         updated_at = NOW() 
     WHERE id = $1`,
    [activityId]
  );

  // Get draft state
  const draftState = await queryOne(
    `SELECT id FROM workflow_states WHERE name = 'draft'`
  );

  // Create validation record
  await query(`
    INSERT INTO validations (activity_id, validator_id, workflow_state_id, decision, comments, validation_date, created_at)
    VALUES ($1, $2, $3, 'revision_requested', $4, NOW(), NOW())
  `, [activityId, validatorId, draftState?.id, comments || 'Revision requested']);

  // Notify activity owner
  await query(`
    INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
    VALUES ($1, 'activity_revision_requested', 'Révision demandée', $2, $3, $4, false)
  `, [activity.user_id, `Une révision a été demandée pour votre activité. ${comments || ''}`, activityType, activityId]);

  return {
    success: true,
    status: 'draft',
    message: 'Revision requested, activity returned to draft'
  };
}
