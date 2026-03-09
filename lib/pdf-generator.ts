import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ActivityData {
  type: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface ReportData {
  userName: string;
  userEmail: string;
  academicYear: string;
  department: string;
  activities: ActivityData[];
  totalHours?: number;
  generatedAt: string;
}

interface DetailedActivityData {
  teaching?: any[];
  supervision?: any[];
  research?: any[];
  exams?: any[];
  responsibilities?: any[];
}

interface UserData {
  first_name: string;
  last_name: string;
  email: string;
  grade?: string;
  department_name?: string;
}

export class AcademicReportGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addHeader(title: string, subtitle?: string) {
    // Add logo or institution name
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ESPRIT School of Business', this.pageWidth / 2, this.currentY, { align: 'center' });
    
    this.currentY += 10;
    this.doc.setFontSize(14);
    this.doc.text(title, this.pageWidth / 2, this.currentY, { align: 'center' });
    
    if (subtitle) {
      this.currentY += 7;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, this.pageWidth / 2, this.currentY, { align: 'center' });
    }

    this.currentY += 10;
    this.addLine();
    this.currentY += 5;
  }

  private addLine() {
    this.doc.setDrawColor(200, 200, 200);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
  }

  private addSection(title: string) {
    this.checkPageBreak(20);
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 51, 102);
    this.doc.text(title, this.margin, this.currentY);
    this.currentY += 7;
    this.doc.setTextColor(0, 0, 0);
    this.doc.setFont('helvetica', 'normal');
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.doc.addPage();
      this.currentY = this.margin;
    }
  }

  private addUserInfo(userData: UserData) {
    this.addSection('Informations Enseignant');
    
    const info = [
      ['Nom complet', `${userData.first_name} ${userData.last_name}`],
      ['Email', userData.email],
      ['Grade', userData.grade || 'N/A'],
      ['Département', userData.department_name || 'N/A']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [],
      body: info,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 2 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 50 },
        1: { cellWidth: 'auto' }
      },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addTeachingActivities(activities: any[]) {
    if (!activities || activities.length === 0) return;

    this.addSection(`Activités d'Enseignement (${activities.length})`);

    const tableData = activities.map(a => [
      a.module_name || 'N/A',
      a.formation_name || 'N/A',
      `S${a.semester}`,
      a.teaching_type || 'N/A',
      a.planned_hours?.toString() || '0',
      a.actual_hours?.toString() || '0',
      a.status || 'draft'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Module', 'Formation', 'Sem.', 'Type', 'H. Prévues', 'H. Réelles', 'Statut']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Add totals
    const totalPlanned = activities.reduce((sum, a) => sum + (a.planned_hours || 0), 0);
    const totalActual = activities.reduce((sum, a) => sum + (a.actual_hours || 0), 0);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total heures prévues: ${totalPlanned}`, this.margin, this.currentY);
    this.currentY += 5;
    this.doc.text(`Total heures réalisées: ${totalActual}`, this.margin, this.currentY);
    this.currentY += 10;
    this.doc.setFont('helvetica', 'normal');
  }

  private addSupervisionActivities(activities: any[]) {
    if (!activities || activities.length === 0) return;

    this.addSection(`Activités d'Encadrement (${activities.length})`);

    const tableData = activities.map(a => [
      a.supervision_type || 'N/A',
      a.title || 'N/A',
      `${a.student_first_name || ''} ${a.student_last_name || ''}`.trim() || 'N/A',
      a.role || 'N/A',
      a.status || 'in_progress',
      a.academic_year || 'N/A'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Type', 'Titre', 'Étudiant', 'Rôle', 'Statut', 'Année']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Add statistics
    const byType = {
      PFE: activities.filter(a => a.supervision_type === 'PFE').length,
      Memoire: activities.filter(a => a.supervision_type === 'Memoire').length,
      Stage: activities.filter(a => a.supervision_type === 'Stage').length,
      These: activities.filter(a => a.supervision_type === 'These').length
    };

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Répartition: PFE: ${byType.PFE}, Mémoire: ${byType.Memoire}, Stage: ${byType.Stage}, Thèse: ${byType.These}`, this.margin, this.currentY);
    this.currentY += 10;
    this.doc.setFont('helvetica', 'normal');
  }

  private addResearchActivities(activities: any[]) {
    if (!activities || activities.length === 0) return;

    this.addSection(`Publications Scientifiques (${activities.length})`);

    const tableData = activities.map(a => [
      a.publication_type || 'N/A',
      a.title?.substring(0, 50) + (a.title?.length > 50 ? '...' : '') || 'N/A',
      a.journal_name || a.conference_name || 'N/A',
      a.indexation || 'N/A',
      a.quartile || '-',
      new Date(a.publication_date).getFullYear().toString()
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Type', 'Titre', 'Journal/Conf.', 'Index.', 'Q', 'Année']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Add statistics
    const byType = {
      Article: activities.filter(a => a.publication_type === 'Article').length,
      Conference: activities.filter(a => a.publication_type === 'Conference').length,
      Book_Chapter: activities.filter(a => a.publication_type === 'Book_Chapter').length,
      Book: activities.filter(a => a.publication_type === 'Book').length
    };

    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Articles: ${byType.Article}, Conférences: ${byType.Conference}, Chapitres: ${byType.Book_Chapter}, Livres: ${byType.Book}`, this.margin, this.currentY);
    this.currentY += 10;
    this.doc.setFont('helvetica', 'normal');
  }

  private addExamSupervisions(activities: any[]) {
    if (!activities || activities.length === 0) return;

    this.addSection(`Surveillances d'Examens (${activities.length})`);

    const tableData = activities.map(a => [
      a.module_name || 'N/A',
      a.exam_type || 'N/A',
      a.session || 'N/A',
      new Date(a.exam_date).toLocaleDateString('fr-FR'),
      a.hours?.toString() || '0',
      a.room || 'N/A'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Module', 'Type', 'Session', 'Date', 'Heures', 'Salle']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 5;

    // Add totals
    const totalHours = activities.reduce((sum, a) => sum + (a.hours || 0), 0);
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`Total heures de surveillance: ${totalHours}`, this.margin, this.currentY);
    this.currentY += 10;
    this.doc.setFont('helvetica', 'normal');
  }

  private addResponsibilities(activities: any[]) {
    if (!activities || activities.length === 0) return;

    this.addSection(`Responsabilités Académiques (${activities.length})`);

    const tableData = activities.map(a => [
      a.responsibility_type?.replace(/_/g, ' ') || 'N/A',
      a.title || 'N/A',
      new Date(a.start_date).toLocaleDateString('fr-FR'),
      a.end_date ? new Date(a.end_date).toLocaleDateString('fr-FR') : 'En cours',
      a.hours_allocated?.toString() || '0',
      a.status || 'active'
    ]);

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Type', 'Titre', 'Début', 'Fin', 'Heures', 'Statut']],
      body: tableData,
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [0, 51, 102], textColor: 255 },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addSummary(activityData: DetailedActivityData) {
    this.checkPageBreak(50);
    this.addSection('Synthèse Globale');

    const summary = [
      ['Nombre de modules enseignés', activityData.teaching?.length?.toString() || '0'],
      ['Total heures d\'enseignement', activityData.teaching?.reduce((sum, a) => sum + (a.actual_hours || 0), 0).toString() || '0'],
      ['Nombre d\'encadrements', activityData.supervision?.length?.toString() || '0'],
      ['Publications scientifiques', activityData.research?.length?.toString() || '0'],
      ['Heures de surveillance', activityData.exams?.reduce((sum, a) => sum + (a.hours || 0), 0).toString() || '0'],
      ['Responsabilités académiques', activityData.responsibilities?.length?.toString() || '0']
    ];

    autoTable(this.doc, {
      startY: this.currentY,
      head: [],
      body: summary,
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 'auto', halign: 'right' }
      },
      headStyles: { fillColor: [0, 51, 102] },
      margin: { left: this.margin, right: this.margin }
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addFooter(academicYear: string) {
    const pageCount = (this.doc as any).internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.setFontSize(8);
      this.doc.setTextColor(128);
      
      // Left footer
      this.doc.text(
        `Rapport d'activités académiques ${academicYear}`,
        this.margin,
        this.pageHeight - 10
      );
      
      // Center footer
      this.doc.text(
        `Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
      
      // Right footer - page numbers
      this.doc.text(
        `Page ${i} / ${pageCount}`,
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }

  generateAnnualReport(
    userData: UserData,
    activityData: DetailedActivityData,
    academicYear: string
  ): jsPDF {
    // Reset document
    this.currentY = this.margin;

    // Add header
    this.addHeader(
      'Rapport Annuel d\'Activités Académiques',
      `Année Universitaire ${academicYear}`
    );

    // Add user information
    this.addUserInfo(userData);

    // Add all activity sections
    this.addTeachingActivities(activityData.teaching || []);
    this.addSupervisionActivities(activityData.supervision || []);
    this.addResearchActivities(activityData.research || []);
    this.addExamSupervisions(activityData.exams || []);
    this.addResponsibilities(activityData.responsibilities || []);

    // Add summary
    this.addSummary(activityData);

    // Add footer to all pages
    this.addFooter(academicYear);

    return this.doc;
  }

  save(filename: string) {
    this.doc.save(filename);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }

  getBase64(): string {
    return this.doc.output('dataurlstring');
  }

  getBuffer(): Buffer {
    return Buffer.from(this.doc.output('arraybuffer'));
  }
}

// Legacy function for backward compatibility
export function generatePDF(reportData: ReportData): Buffer {
  const doc = new jsPDF();
  
  // Set colors
  const primaryColor = [42, 89, 150]; // Blue
  const textColor = [20, 20, 20];

  // Header
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(0, 0, 210, 40, 'F');

  // Logo/Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.text('ESPRIT', 20, 18);
  
  doc.setFontSize(10);
  doc.text('Rapport d\'Activités Académiques', 20, 28);

  // Main content
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.setFontSize(12);

  let yPos = 50;

  // User Information
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Informations Personnelles', 20, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  yPos += 7;
  doc.text(`Enseignant: ${reportData.userName}`, 20, yPos);
  yPos += 6;
  doc.text(`Email: ${reportData.userEmail}`, 20, yPos);
  yPos += 6;
  doc.text(`Année Académique: ${reportData.academicYear}`, 20, yPos);
  yPos += 6;
  doc.text(`Département: ${reportData.department}`, 20, yPos);

  yPos += 10;

  // Activities Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Activités Déclarées', 20, yPos);

  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (reportData.activities.length === 0) {
    doc.text('Aucune activité déclarée', 20, yPos);
  } else {
    reportData.activities.forEach((activity, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Activity number
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${getActivityLabel(activity.type)}`, 20, yPos);
      
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      
      const dateRange = `${new Date(activity.startDate).toLocaleDateString('fr-FR')} - ${new Date(activity.endDate).toLocaleDateString('fr-FR')}`;
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

  yPos += 10;

  // Summary
  if (reportData.totalHours) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Résumé', 20, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Total d'heures déclarées: ${reportData.totalHours}h`, 20, yPos);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} sur ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
    doc.text(
      `Généré le ${reportData.generatedAt}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 5,
      { align: 'center' }
    );
  }

  // Return as buffer
  return Buffer.from(doc.output('arraybuffer'));
}

function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    'enseignement': 'Enseignement',
    'recherche': 'Recherche',
    'responsabilites': 'Responsabilités',
    'encadrement': 'Encadrement',
    'jury': 'Participation à Jury',
    'surveillance': 'Surveillance d\'examen',
    'conference': 'Conférence',
    'evenement': 'Événement Scientifique'
  };
  return labels[type] || type;
}

export default AcademicReportGenerator;

