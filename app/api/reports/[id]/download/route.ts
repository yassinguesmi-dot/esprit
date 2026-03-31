import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { queryOne, query } from '@/lib/db';
import { getDemoReport, getActivityLabel, isDemoUser } from '@/lib/demo-store';
import jsPDF from 'jspdf';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isDemoUser(decoded.userId)) {
      const demoData = getDemoReport(decoded.userId, id);

      if (!demoData) {
        return NextResponse.json(
          { error: 'Report not found' },
          { status: 404 }
        );
      }

      const buffer = buildPdfBuffer(demoData.report, demoData.user, demoData.activities);

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="rapport_${demoData.user.prenom}_${demoData.user.nom}_${demoData.report.anneeAcademique}.pdf"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    }

    // Get report
    const report = await queryOne(
      `SELECT id, utilisateur_id as userId, annee_academique as academicYear, 
              date_generation as generatedAt
       FROM rapports
       WHERE id = $1 AND utilisateur_id = $2`,
      [id, decoded.userId]
    );

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    // Get user data
    const user = await queryOne(
      'SELECT nom, prenom, email, departement FROM utilisateurs WHERE id = $1',
      [decoded.userId]
    );

    // Get activities for this report (validated or fully approved)
    const activities = await query(
      `SELECT 
        type_activite as type,
        date_debut as startDate,
        date_fin as endDate,
        description
      FROM activites
      WHERE utilisateur_id = $1
        AND statut IN ('validated', 'approved')
        AND EXTRACT(YEAR FROM date_debut) = CAST($2 AS INTEGER)
      ORDER BY date_debut DESC`,
      [decoded.userId, report.academicYear]
    );

    const buffer = buildPdfBuffer(
      { anneeAcademique: report.academicYear, generatedAt: report.generatedAt },
      user,
      activities
    );

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rapport_${user.prenom}_${user.nom}_${report.academicYear}.pdf"`,
        'Content-Length': buffer.length.toString()
      }
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

function buildPdfBuffer(report: any, user: any, activities: any[]) {
  const doc = new jsPDF();

  doc.setFillColor(227, 6, 19);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('ESPRIT', 20, 18);
  doc.setFontSize(10);
  doc.text('Rapport d\'Activités Académiques', 20, 28);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(12);

  let yPos = 50;
  doc.setFontSize(11);
  doc.setFont(undefined, 'bold');
  doc.text('Informations Personnelles', 20, yPos);

  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  yPos += 7;
  doc.text(`Enseignant: ${user.prenom} ${user.nom}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${user.email}`, 20, yPos);
  yPos += 6;
  doc.text(`Année Académique: ${report.anneeAcademique || report.academicYear}`, 20, yPos);
  yPos += 6;
  doc.text(`Département: ${user.departement || 'N/A'}`, 20, yPos);

  yPos += 10;
  doc.setFont(undefined, 'bold');
  doc.setFontSize(11);
  doc.text('Activités Déclarées', 20, yPos);

  yPos += 7;
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);

  if (activities.length === 0) {
    doc.text('Aucune activité déclarée', 20, yPos);
  } else {
    activities.forEach((activity: any, index: number) => {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont(undefined, 'bold');
      doc.text(`${index + 1}. ${activity.titre || getActivityLabel(activity.type || activity.typeActivite)}`, 20, yPos);

      yPos += 6;
      doc.setFont(undefined, 'normal');

      const start = activity.dateDebut || activity.startDate;
      const end = activity.dateFin || activity.endDate;
      const dateRange = `${new Date(start).toLocaleDateString('fr-FR')} - ${new Date(end).toLocaleDateString('fr-FR')}`;
      doc.text(`Période: ${dateRange}`, 25, yPos);

      yPos += 6;
      if (activity.description) {
        const descriptionLines = doc.splitTextToSize(activity.description, 160);
        doc.text(descriptionLines, 25, yPos);
        yPos += descriptionLines.length * 4 + 2;
      }

      yPos += 4;
    });
  }

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const pageCount = doc.getNumberOfPages();
  const generatedDate = new Date(report.generatedAt || report.createdAt || new Date()).toLocaleDateString('fr-FR');

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Généré le ${generatedDate}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  return Buffer.from(doc.output('arraybuffer'));
}
