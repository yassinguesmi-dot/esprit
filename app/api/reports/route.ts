import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { query, queryOne, execute } from '@/lib/db';
import { createDemoReport, formatAcademicYear, isDemoUser, listDemoReports, mapReportToClient } from '@/lib/demo-store';

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
      return NextResponse.json({ reports: listDemoReports(decoded.userId) });
    }

    // Get user's reports
    const reports = await query(
      `SELECT 
        id,
        utilisateur_id as userId,
        annee_academique as academicYear,
        date_generation as generatedAt,
        statut as status
      FROM rapports
      WHERE utilisateur_id = $1
      ORDER BY date_generation DESC`,
      [decoded.userId]
    );

    return NextResponse.json({ reports: reports.map(mapReportToClient) });
  } catch (error) {
    console.error('GET reports error:', error);
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

    const body = await request.json();
    const academicYear = formatAcademicYear(body.academicYear || body.anneeAcademique);
    const academicYearValue = academicYear.match(/\d{4}/)?.[0] || academicYear;

    if (!academicYear) {
      return NextResponse.json(
        { error: 'Academic year is required' },
        { status: 400 }
      );
    }

    if (isDemoUser(decoded.userId)) {
      return NextResponse.json(createDemoReport(decoded.userId, academicYear), { status: 201 });
    }

    // Get user data
    const user = await queryOne(
      'SELECT nom, prenom, email, departement FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get validated activities for the academic year
    const activities = await query(
      `SELECT 
        id,
        type_activite as type,
        date_debut as startDate,
        date_fin as endDate,
        description,
        EXTRACT(EPOCH FROM (date_fin - date_debut)) / 3600 as hours
      FROM activites
      WHERE utilisateur_id = $1
        AND statut = 'validated'
        AND EXTRACT(YEAR FROM date_debut) = CAST($2 AS INTEGER)
      ORDER BY date_debut DESC`,
      [decoded.userId, academicYearValue]
    );

    const totalHours = activities.reduce((sum: number, a: any) => sum + (a.hours || 0), 0);

    // Create report record
    const report = await queryOne(
      `INSERT INTO rapports 
      (utilisateur_id, annee_academique, date_generation, statut)
      VALUES ($1, $2, NOW(), 'generated')
      RETURNING id, utilisateur_id as userId, annee_academique as academicYear,
                date_generation as generatedAt, statut as status`,
      [decoded.userId, academicYear]
    );

    // Create audit log
    await execute(
      `INSERT INTO audit_logs 
      (utilisateur_id, action, table_affectee, id_enregistrement, nouvelle_valeur, date_action)
      VALUES ($1, 'GENERATION_RAPPORT', 'rapports', $2, 'generated', NOW())`,
      [decoded.userId, report.id]
    );

    return NextResponse.json(mapReportToClient(report), { status: 201 });
  } catch (error) {
    console.error('POST reports error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
