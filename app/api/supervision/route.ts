// API Routes for Supervision Activities (PFE, Memoire, Stage, These)
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET all supervision activities for a user
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
    const supervisionType = searchParams.get('type');
    const status = searchParams.get('status');

    let queryText = `
      SELECT 
        sa.id,
        sa.user_id,
        sa.student_id,
        s.student_number,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        sa.supervision_type,
        sa.title,
        sa.description,
        f.name as formation_name,
        sa.academic_year,
        sa.start_date,
        sa.end_date,
        sa.defense_date,
        sa.role,
        sa.status,
        sa.grade,
        sa.remarks,
        sa.documents,
        sa.co_supervisor_id,
        cs.first_name || ' ' || cs.last_name as co_supervisor_name,
        sa.status_validation,
        sa.validated_by,
        sa.validation_date,
        sa.created_at,
        sa.updated_at
      FROM supervision_activities sa
      LEFT JOIN students s ON sa.student_id = s.id
      LEFT JOIN formations f ON sa.formation_id = f.id
      LEFT JOIN users cs ON sa.co_supervisor_id = cs.id
      WHERE sa.user_id = $1
    `;

    const params: any[] = [decoded.userId];
    let paramCount = 1;

    if (academicYear) {
      paramCount++;
      queryText += ` AND sa.academic_year = $${paramCount}`;
      params.push(academicYear);
    }

    if (supervisionType) {
      paramCount++;
      queryText += ` AND sa.supervision_type = $${paramCount}`;
      params.push(supervisionType);
    }

    if (status) {
      paramCount++;
      queryText += ` AND sa.status = $${paramCount}`;
      params.push(status);
    }

    queryText += ' ORDER BY sa.academic_year DESC, sa.created_at DESC';

    const supervisions = await query(queryText, params);

    // Calculate statistics
    const stats = {
      total: supervisions.length,
      by_type: {
        PFE: supervisions.filter((s: any) => s.supervision_type === 'PFE').length,
        Memoire: supervisions.filter((s: any) => s.supervision_type === 'Memoire').length,
        Stage: supervisions.filter((s: any) => s.supervision_type === 'Stage').length,
        These: supervisions.filter((s: any) => s.supervision_type === 'These').length,
      },
      by_status: {
        in_progress: supervisions.filter((s: any) => s.status === 'in_progress').length,
        defended: supervisions.filter((s: any) => s.status === 'defended').length,
        canceled: supervisions.filter((s: any) => s.status === 'canceled').length,
      },
      by_role: {
        Encadrant: supervisions.filter((s: any) => s.role === 'Encadrant').length,
        Rapporteur: supervisions.filter((s: any) => s.role === 'Rapporteur').length,
        President: supervisions.filter((s: any) => s.role === 'President').length,
      }
    };

    return NextResponse.json({ supervisions, stats });
  } catch (error) {
    console.error('GET supervision activities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new supervision activity
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
      student_id,
      supervision_type,
      title,
      description,
      formation_id,
      academic_year,
      start_date,
      end_date,
      defense_date,
      role,
      status,
      grade,
      remarks,
      documents,
      co_supervisor_id
    } = body;

    // Validate required fields
    if (!supervision_type || !title || !academic_year || !start_date || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate supervision type
    const validTypes = ['PFE', 'Memoire', 'Stage', 'These'];
    if (!validTypes.includes(supervision_type)) {
      return NextResponse.json(
        { error: 'Invalid supervision type' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['Encadrant', 'Rapporteur', 'President'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    // Insert supervision activity
    const supervision = await queryOne(`
      INSERT INTO supervision_activities (
        user_id, student_id, supervision_type, title, description,
        formation_id, academic_year, start_date, end_date, defense_date,
        role, status, grade, remarks, documents, co_supervisor_id,
        status_validation, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'pending', NOW(), NOW())
      RETURNING 
        id, user_id, student_id, supervision_type, title, description,
        formation_id, academic_year, start_date, end_date, defense_date,
        role, status, grade, remarks, documents, co_supervisor_id,
        status_validation, created_at
    `, [
      decoded.userId,
      student_id || null,
      supervision_type,
      title,
      description || null,
      formation_id || null,
      academic_year,
      start_date,
      end_date || null,
      defense_date || null,
      role,
      status || 'in_progress',
      grade || null,
      remarks || null,
      JSON.stringify(documents || []),
      co_supervisor_id || null
    ]);

    // Create notification for department head
    const user = await queryOne('SELECT department_id FROM users WHERE id = $1', [decoded.userId]);
    if (user?.department_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
        SELECT 
          u.id,
          'supervision_created',
          'Nouvelle activité d''encadrement',
          'Une nouvelle activité d''encadrement a été créée et attend validation.',
          'supervision_activity',
          $1,
          false
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.department_id = $2 AND r.name = 'chef_departement'
      `, [supervision.id, user.department_id]);
    }

    return NextResponse.json(supervision, { status: 201 });
  } catch (error) {
    console.error('POST supervision activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update supervision activity
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
      return NextResponse.json({ error: 'Supervision ID required' }, { status: 400 });
    }

    // Check ownership
    const existing = await queryOne(
      'SELECT user_id, status_validation FROM supervision_activities WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (existing.status_validation === 'validated') {
      return NextResponse.json(
        { error: 'Cannot modify validated supervision' },
        { status: 400 }
      );
    }

    // Build update query
    const allowedFields = [
      'student_id', 'supervision_type', 'title', 'description', 'formation_id',
      'academic_year', 'start_date', 'end_date', 'defense_date', 'role',
      'status', 'grade', 'remarks', 'documents', 'co_supervisor_id'
    ];

    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = $${paramCount}`);
        updateValues.push(key === 'documents' ? JSON.stringify(updates[key]) : updates[key]);
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updateValues.push(id);
    const supervision = await queryOne(`
      UPDATE supervision_activities
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    return NextResponse.json(supervision);
  } catch (error) {
    console.error('PUT supervision activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
