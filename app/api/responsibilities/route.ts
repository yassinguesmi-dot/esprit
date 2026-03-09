// API Routes for Academic Responsibilities
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';

// GET all academic responsibilities for a user
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
    const responsibilityType = searchParams.get('type');
    const status = searchParams.get('status');

    let queryText = `
      SELECT 
        ar.id,
        ar.user_id,
        ar.responsibility_type,
        ar.title,
        ar.description,
        d.name as department_name,
        f.name as formation_name,
        m.name as module_name,
        ar.start_date,
        ar.end_date,
        ar.hours_allocated,
        ar.status,
        ar.validated_by,
        ar.validation_date,
        ar.created_at,
        ar.updated_at,
        u.first_name || ' ' || u.last_name as validator_name
      FROM academic_responsibilities ar
      LEFT JOIN departments d ON ar.department_id = d.id
      LEFT JOIN formations f ON ar.formation_id = f.id
      LEFT JOIN modules m ON ar.module_id = m.id
      LEFT JOIN users u ON ar.validated_by = u.id
      WHERE ar.user_id = $1
    `;

    const params: any[] = [decoded.userId];
    let paramCount = 1;

    if (responsibilityType) {
      paramCount++;
      queryText += ` AND ar.responsibility_type = $${paramCount}`;
      params.push(responsibilityType);
    }

    if (status) {
      paramCount++;
      queryText += ` AND ar.status = $${paramCount}`;
      params.push(status);
    }

    queryText += ' ORDER BY ar.start_date DESC, ar.created_at DESC';

    const responsibilities = await query(queryText, params);

    // Calculate statistics
    const stats = {
      total: responsibilities.length,
      total_hours: responsibilities.reduce((sum: number, r: any) => sum + (r.hours_allocated || 0), 0),
      by_type: {
        Maitre_Stage: responsibilities.filter((r: any) => r.responsibility_type === 'Maitre_Stage').length,
        Coordinateur_Module: responsibilities.filter((r: any) => r.responsibility_type === 'Coordinateur_Module').length,
        Responsable_Filiere: responsibilities.filter((r: any) => r.responsibility_type === 'Responsable_Filiere').length,
        Chef_Departement: responsibilities.filter((r: any) => r.responsibility_type === 'Chef_Departement').length,
        Directeur_Programme: responsibilities.filter((r: any) => r.responsibility_type === 'Directeur_Programme').length,
      },
      by_status: {
        active: responsibilities.filter((r: any) => r.status === 'active').length,
        completed: responsibilities.filter((r: any) => r.status === 'completed').length,
      }
    };

    return NextResponse.json({ responsibilities, stats });
  } catch (error) {
    console.error('GET academic responsibilities error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST create new academic responsibility
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
      responsibility_type,
      title,
      description,
      department_id,
      formation_id,
      module_id,
      start_date,
      end_date,
      hours_allocated,
      status
    } = body;

    // Validate required fields
    if (!responsibility_type || !title || !start_date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate responsibility type
    const validTypes = [
      'Maitre_Stage',
      'Coordinateur_Module',
      'Responsable_Filiere',
      'Chef_Departement',
      'Directeur_Programme'
    ];
    if (!validTypes.includes(responsibility_type)) {
      return NextResponse.json(
        { error: 'Invalid responsibility type' },
        { status: 400 }
      );
    }

    // Insert academic responsibility
    const responsibility = await queryOne(`
      INSERT INTO academic_responsibilities (
        user_id, responsibility_type, title, description, department_id,
        formation_id, module_id, start_date, end_date, hours_allocated,
        status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING 
        id, user_id, responsibility_type, title, description,
        department_id, formation_id, module_id, start_date, end_date,
        hours_allocated, status, created_at
    `, [
      decoded.userId,
      responsibility_type,
      title,
      description || null,
      department_id || null,
      formation_id || null,
      module_id || null,
      start_date,
      end_date || null,
      hours_allocated || null,
      status || 'active'
    ]);

    // Create notification for department head
    const user = await queryOne('SELECT department_id FROM users WHERE id = $1', [decoded.userId]);
    if (user?.department_id) {
      await query(`
        INSERT INTO notifications (user_id, type, title, message, related_entity_type, related_entity_id, is_read)
        SELECT 
          u.id,
          'responsibility_created',
          'Nouvelle responsabilité académique',
          'Une nouvelle responsabilité académique a été déclarée.',
          'academic_responsibility',
          $1,
          false
        FROM users u
        INNER JOIN roles r ON u.role_id = r.id
        WHERE u.department_id = $2 AND r.name = 'chef_departement'
      `, [responsibility.id, user.department_id]);
    }

    return NextResponse.json(responsibility, { status: 201 });
  } catch (error) {
    console.error('POST academic responsibility error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT update academic responsibility
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
      return NextResponse.json({ error: 'Responsibility ID required' }, { status: 400 });
    }

    // Check ownership
    const existing = await queryOne(
      'SELECT user_id, validated_by FROM academic_responsibilities WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Responsibility not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (existing.validated_by) {
      return NextResponse.json(
        { error: 'Cannot modify validated responsibility' },
        { status: 400 }
      );
    }

    // Build update query
    const allowedFields = [
      'responsibility_type', 'title', 'description', 'department_id',
      'formation_id', 'module_id', 'start_date', 'end_date',
      'hours_allocated', 'status'
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
    const responsibility = await queryOne(`
      UPDATE academic_responsibilities
      SET ${updateFields.join(', ')}, updated_at = NOW()
      WHERE id = $${paramCount}
      RETURNING *
    `, updateValues);

    return NextResponse.json(responsibility);
  } catch (error) {
    console.error('PUT academic responsibility error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE academic responsibility
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Responsibility ID required' }, { status: 400 });
    }

    // Check ownership
    const existing = await queryOne(
      'SELECT user_id FROM academic_responsibilities WHERE id = $1',
      [id]
    );

    if (!existing) {
      return NextResponse.json({ error: 'Responsibility not found' }, { status: 404 });
    }

    if (existing.user_id !== decoded.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await query('DELETE FROM academic_responsibilities WHERE id = $1', [id]);

    return NextResponse.json({ message: 'Responsibility deleted successfully' });
  } catch (error) {
    console.error('DELETE academic responsibility error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
