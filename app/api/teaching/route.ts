// API Routes for Teaching Activities
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET all teaching activities for a user
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
    const academicYear = searchParams.get('academic_year');
    const semester = searchParams.get('semester');
    const status = searchParams.get('status');

    let queryText = `
      SELECT 
        ta.id,
        ta.user_id,
        f.name as formation_name,
        c.name as class_name,
        m.name as module_name,
        m.code as module_code,
        ta.semester,
        ta.academic_year,
        ta.teaching_type,
        ta.teaching_language,
        ta.planned_hours,
        ta.actual_hours,
        ta.course_type,
        ta.syllabus_url,
        ta.status,
        ta.comments,
        ta.validated_by,
        ta.validation_date,
        ta.created_at,
        ta.updated_at,
        u.first_name || ' ' || u.last_name as validator_name
      FROM teaching_activities ta
      LEFT JOIN formations f ON ta.formation_id = f.id
      LEFT JOIN classes c ON ta.class_id = c.id
      LEFT JOIN modules m ON ta.module_id = m.id
      LEFT JOIN users u ON ta.validated_by = u.id
      WHERE ta.user_id = $1
    `;

    const params: any[] = [decoded.userId];
    let paramCount = 1;

    if (academicYear) {
      paramCount++;
      queryText += ` AND ta.academic_year = $${paramCount}`;
      params.push(academicYear);
    }

    if (semester) {
      paramCount++;
      queryText += ` AND ta.semester = $${paramCount}`;
      params.push(semester);
    }

    if (status) {
      paramCount++;
      queryText += ` AND ta.status = $${paramCount}`;
      params.push(status);
    }

    queryText += ' ORDER BY ta.academic_year DESC, ta.semester DESC, ta.created_at DESC';

    const activities = await query(queryText, params);

    // Calculate totals
    const totals = {
      planned_hours: activities.reduce((sum: number, a: any) => sum + (a.planned_hours || 0), 0),
      actual_hours: activities.reduce((sum: number, a: any) => sum + (a.actual_hours || 0), 0),
      count: activities.length
    };

    return NextResponse.json({ activities, totals });
  } catch (error) {
    console.error('GET teaching activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new teaching activity
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
    const {
      formation_id,
      class_id,
      module_id,
      semester,
      academic_year,
      teaching_type,
      teaching_language,
      planned_hours,
      actual_hours,
      course_type,
      syllabus_url,
      comments
    } = body;

    // Validate required fields
    if (!module_id || !semester || !academic_year || !teaching_type || !planned_hours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate teaching type
    const validTeachingTypes = ['présentiel', 'en ligne', 'alternance', 'exécutif'];
    if (!validTeachingTypes.includes(teaching_type)) {
      return NextResponse.json(
        { error: 'Invalid teaching type' },
        { status: 400 }
      );
    }

    // Insert teaching activity
    const activity = await queryOne(`
      INSERT INTO teaching_activities (
        user_id, formation_id, class_id, module_id, semester, academic_year,
        teaching_type, teaching_language, planned_hours, actual_hours,
        course_type, syllabus_url, comments, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'draft', NOW(), NOW())
      RETURNING 
        id, user_id, formation_id, class_id, module_id, semester, academic_year,
        teaching_type, teaching_language, planned_hours, actual_hours,
        course_type, syllabus_url, status, comments, created_at
    `, [
      decoded.userId,
      formation_id || null,
      class_id || null,
      module_id,
      semester,
      academic_year,
      teaching_type,
      teaching_language || null,
      planned_hours,
      actual_hours || 0,
      course_type || null,
      syllabus_url || null,
      comments || null
    ]);

    // Create notification for department head
    const user = await queryOne('SELECT department_id FROM users WHERE id = $1', [decoded.userId]);
    if (user?.department_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
        SELECT 
          u.id,
          'teaching_activity_created',
          'Nouvelle activité d''enseignement',
          'Une nouvelle activité d''enseignement a été créée et attend validation.',
          'teaching_activity',
          $1,
          false
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.department_id = $2 AND r.name = 'chef_departement'
      `, [activity.id, user.department_id]);
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('POST teaching activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update teaching activity
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

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Activity ID required' }, { status: 400 });
    }

    // Check ownership
    const existing = await queryOne(
      'SELECT user_id, status FROM teaching_activities WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (existing.status === 'validated') {
      return NextResponse.json(
        { error: 'Cannot modify validated activity' },
        { status: 400 }
      );
    }

    // Build update query
    const allowedFields = [
      'formation_id', 'class_id', 'module_id', 'semester', 'academic_year',
      'teaching_type', 'teaching_language', 'planned_hours', 'actual_hours',
      'course_type', 'syllabus_url', 'comments'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateValues.push(id);
    const activity = await queryOne(`
      UPDATE teaching_activities
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    return NextResponse.json(activity);
  } catch (error) {
    console.error('PUT teaching activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
