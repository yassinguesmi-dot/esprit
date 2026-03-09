// API Route for Report Generation
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { AcademicReportGenerator } from '@/lib/pdf-generator';

// POST - Generate annual report for a user
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
    const { academic_year, user_id } = body;

    // Default to current user if no user_id provided
    const targetUserId = user_id || decoded.userId;

    // Check if user has permission to generate report for another user
    if (user_id && user_id !== decoded.userId) {
      const user = await queryOne(
        `SELECT r.name as role FROM users u
         INNER JOIN roles r ON u.role_id = r.id
         WHERE u.id = $1`,
        [decoded.userId]
      );

      if (!user || !['admin', 'super_admin', 'chef_departement'].includes(user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions to generate reports for other users' },
          { status: 403 }
        );
      }
    }

    // Get user data
    const userData = await queryOne(`
      SELECT 
        u.first_name,
        u.last_name,
        u.email,
        u.grade,
        d.name as department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = $1
    `, [targetUserId]);

    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get teaching activities
    const teachingActivities = await query(`
      SELECT 
        ta.id,
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
        ta.status
      FROM teaching_activities ta
      LEFT JOIN formations f ON ta.formation_id = f.id
      LEFT JOIN classes c ON ta.class_id = c.id
      LEFT JOIN modules m ON ta.module_id = m.id
      WHERE ta.user_id = $1
        ${academic_year ? 'AND ta.academic_year = $2' : ''}
      ORDER BY ta.semester, m.name
    `, academic_year ? [targetUserId, academic_year] : [targetUserId]);

    // Get supervision activities
    const supervisionActivities = await query(`
      SELECT 
        sa.id,
        s.student_number,
        s.first_name as student_first_name,
        s.last_name as student_last_name,
        sa.supervision_type,
        sa.title,
        f.name as formation_name,
        sa.academic_year,
        sa.start_date,
        sa.end_date,
        sa.defense_date,
        sa.role,
        sa.status
      FROM supervision_activities sa
      LEFT JOIN students s ON sa.student_id = s.id
      LEFT JOIN formations f ON sa.formation_id = f.id
      WHERE sa.user_id = $1
        ${academic_year ? 'AND sa.academic_year = $2' : ''}
      ORDER BY sa.start_date DESC
    `, academic_year ? [targetUserId, academic_year] : [targetUserId]);

    // Get research publications
    const researchActivities = await query(`
      SELECT 
        rp.id,
        rp.publication_type,
        rp.title,
        rp.authors,
        rp.publication_date,
        rp.journal_name,
        rp.conference_name,
        rp.indexation,
        rp.quartile,
        rp.impact_factor
      FROM research_publications rp
      WHERE rp.user_id = $1
        ${academic_year ? 'AND EXTRACT(YEAR FROM rp.publication_date)::VARCHAR = $2' : ''}
      ORDER BY rp.publication_date DESC
    `, academic_year ? [targetUserId, academic_year] : [targetUserId]);

    // Get exam supervisions
    const examSupervisions = await query(`
      SELECT 
        es.id,
        m.name as module_name,
        es.exam_type,
        es.exam_date,
        es.session,
        es.semester,
        es.academic_year,
        es.room,
        es.hours
      FROM exam_supervisions es
      LEFT JOIN modules m ON es.module_id = m.id
      WHERE es.user_id = $1
        ${academic_year ? 'AND es.academic_year = $2' : ''}
      ORDER BY es.exam_date DESC
    `, academic_year ? [targetUserId, academic_year] : [targetUserId]);

    // Get responsibilities
    const responsibilities = await query(`
      SELECT 
        ar.id,
        ar.responsibility_type,
        ar.title,
        d.name as department_name,
        f.name as formation_name,
        ar.start_date,
        ar.end_date,
        ar.hours_allocated,
        ar.status
      FROM academic_responsibilities ar
      LEFT JOIN departments d ON ar.department_id = d.id
      LEFT JOIN formations f ON ar.formation_id = f.id
      WHERE ar.user_id = $1
        ${academic_year ? 'AND EXTRACT(YEAR FROM ar.start_date)::VARCHAR = $2' : ''}
      ORDER BY ar.start_date DESC
    `, academic_year ? [targetUserId, academic_year] : [targetUserId]);

    // Generate PDF report
    const reportGenerator = new AcademicReportGenerator();
    reportGenerator.generateAnnualReport(
      userData,
      {
        teaching: teachingActivities,
        supervision: supervisionActivities,
        research: researchActivities,
        exams: examSupervisions,
        responsibilities: responsibilities
      },
      academic_year || 'Toutes années'
    );

    // Get PDF as buffer
    const pdfBuffer = reportGenerator.getBuffer();
    const pdfBody = new Uint8Array(pdfBuffer);

    // Save report record in database
    const report = await queryOne(`
      INSERT INTO reports (
        user_id,
        report_type,
        academic_year,
        generated_by_id,
        activities_included,
        summary,
        status,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'generated', NOW(), NOW())
      RETURNING id, created_at
    `, [
      targetUserId,
      'annual_report',
      academic_year || 'all',
      decoded.userId,
      JSON.stringify({
        teaching_count: teachingActivities.length,
        supervision_count: supervisionActivities.length,
        research_count: researchActivities.length,
        exams_count: examSupervisions.length,
        responsibilities_count: responsibilities.length
      }),
      JSON.stringify({
        total_teaching_hours: teachingActivities.reduce((sum, a) => sum + (a.actual_hours || 0), 0),
        total_exam_hours: examSupervisions.reduce((sum, a) => sum + (a.hours || 0), 0),
        publications: researchActivities.length
      })
    ]);

    // Return PDF as downloadable file
    return new NextResponse(pdfBody, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport_activites_${userData.last_name}_${academic_year || 'all'}.pdf"`,
        'X-Report-ID': report.id
      }
    });

  } catch (error) {
    console.error('POST generate report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Retrieve pdf generated reports
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
    const userId = searchParams.get('user_id') || decoded.userId;
    const reportType = searchParams.get('report_type');

    let queryText = `
      SELECT 
        r.id,
        r.user_id,
        u.first_name || ' ' || u.last_name as user_name,
        r.report_type,
        r.academic_year,
        r.generated_by_id,
        gu.first_name || ' ' || gu.last_name as generated_by_name,
        r.activities_included,
        r.summary,
        r.status,
        r.created_at
      FROM reports r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN users gu ON r.generated_by_id = gu.id
      WHERE r.user_id = $1
    `;

    const params: any[] = [userId];
    let paramCount = 1;

    if (reportType) {
      paramCount++;
      queryText += ` AND r.report_type = $${paramCount}`;
      params.push(reportType);
    }

    queryText += ' ORDER BY r.created_at DESC';

    const reports = await query(queryText, params);

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('GET reports error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
