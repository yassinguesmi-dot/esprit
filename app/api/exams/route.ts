// API Routes for Exam Supervisions
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET all exam supervisions for a user
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
    const session = searchParams.get('session');

    let queryText = `
      SELECT 
        es.id,
        es.user_id,
        m.name as module_name,
        m.code as module_code,
        es.exam_type,
        es.exam_date,
        es.start_time,
        es.end_time,
        es.session,
        es.semester,
        es.academic_year,
        c.name as class_name,
        es.room,
        es.students_count,
        es.hours,
        es.comments,
        es.status,
        es.validated_by,
        es.validation_date,
        es.created_at,
        es.updated_at,
        u.first_name || ' ' || u.last_name as validator_name
      FROM exam_supervisions es
      LEFT JOIN modules m ON es.module_id = m.id
      LEFT JOIN classes c ON es.class_id = c.id
      LEFT JOIN users u ON es.validated_by = u.id
      WHERE es.user_id = $1
    `;

    const params: any[] = [decoded.userId];
    let paramCount = 1;

    if (academicYear) {
      paramCount++;
      queryText += ` AND es.academic_year = $${paramCount}`;
      params.push(academicYear);
    }

    if (semester) {
      paramCount++;
      queryText += ` AND es.semester = $${paramCount}`;
      params.push(parseInt(semester));
    }

    if (session) {
      paramCount++;
      queryText += ` AND es.session = $${paramCount}`;
      params.push(session);
    }

    queryText += ' ORDER BY es.exam_date DESC, es.created_at DESC';

    const supervisions = await query(queryText, params);

    // Calculate totals
    const totals = {
      total_hours: supervisions.reduce((sum: number, s: any) => sum + (s.hours || 0), 0),
      total_count: supervisions.length,
      by_session: {
        Principale: supervisions.filter((s: any) => s.session === 'Principale').length,
        Controle: supervisions.filter((s: any) => s.session === 'Controle').length,
        Rattrapage: supervisions.filter((s: any) => s.session === 'Rattrapage').length,
      },
      by_semester: {
        1: supervisions.filter((s: any) => s.semester === 1).length,
        2: supervisions.filter((s: any) => s.semester === 2).length,
      }
    };

    return NextResponse.json({ supervisions, totals });
  } catch (error) {
    console.error('GET exam supervisions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new exam supervision
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
      module_id,
      exam_type,
      exam_date,
      start_time,
      end_time,
      session,
      semester,
      academic_year,
      class_id,
      room,
      students_count,
      hours,
      comments
    } = body;

    // Validate required fields
    if (!exam_type || !exam_date || !session || !academic_year || !hours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate exam type
    const validExamTypes = ['DS', 'Exam Final', 'Rattrapage'];
    if (!validExamTypes.includes(exam_type)) {
      return NextResponse.json(
        { error: 'Invalid exam type' },
        { status: 400 }
      );
    }

    // Validate session
    const validSessions = ['Principale', 'Controle', 'Rattrapage'];
    if (!validSessions.includes(session)) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }

    // Insert exam supervision
    const supervision = await queryOne(`
      INSERT INTO exam_supervisions (
        user_id, module_id, exam_type, exam_date, start_time, end_time,
        session, semester, academic_year, class_id, room, students_count,
        hours, comments, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'scheduled', NOW(), NOW())
      RETURNING 
        id, user_id, module_id, exam_type, exam_date, start_time, end_time,
        session, semester, academic_year, class_id, room, students_count,
        hours, comments, status, created_at
    `, [
      decoded.userId,
      module_id || null,
      exam_type,
      exam_date,
      start_time || null,
      end_time || null,
      session,
      semester || null,
      academic_year,
      class_id || null,
      room || null,
      students_count || null,
      hours,
      comments || null
    ]);

    return NextResponse.json(supervision, { status: 201 });
  } catch (error) {
    console.error('POST exam supervision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update exam supervision
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
      'SELECT user_id, status FROM exam_supervisions WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Supervision not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Build update query
    const allowedFields = [
      'module_id', 'exam_type', 'exam_date', 'start_time', 'end_time',
      'session', 'semester', 'academic_year', 'class_id', 'room',
      'students_count', 'hours', 'comments', 'status'
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
    const supervision = await queryOne(`
      UPDATE exam_supervisions
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    return NextResponse.json(supervision);
  } catch (error) {
    console.error('PUT exam supervision error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
