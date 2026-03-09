'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ReportCard } from '@/components/ReportCard';
import { Button } from '@/components/ui/button';

interface Report {
  id: string;
  titre: string;
  anneeAcademique: string;
  createdAt: string;
  status: 'draft' | 'ready' | 'archived';
  pageCount?: number;
}

export default function ReportsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingYear, setGeneratingYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchReports = async () => {
      try {
        setLoadingReports(true);
        const response = await fetch('/api/reports', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) throw new Error('Erreur de chargement');

        const data = await response.json();
        setReports(data.reports || []);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des rapports');
        console.error(err);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [user]);

  const handleGenerateReport = async () => {
    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          anneeAcademique: generatingYear,
        }),
      });

      if (!response.ok) throw new Error('Erreur de génération');

      const newReport = await response.json();
      setReports([newReport, ...reports]);
      setSuccessMessage('Rapport généré avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de la génération du rapport');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Erreur de téléchargement');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${reportId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Erreur lors du téléchargement');
      console.error(err);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce rapport ?')) return;

    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Erreur de suppression');

      setReports(reports.filter(r => r.id !== reportId));
      setSuccessMessage('Rapport supprimé avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mes Rapports"
        description="Consultez et générez vos rapports annuels d'activités"
        icon="📄"
      />

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-lg bg-green-100 border border-green-300 text-green-700">
          {successMessage}
        </div>
      )}

      {/* Generate Report Section */}
      <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">Générer un nouveau rapport</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Créez un rapport annuel complet avec toutes vos activités validées
            </p>

            <div className="flex items-end gap-3">
              <div className="flex-1 max-w-xs">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Année académique
                </label>
                <select
                  value={generatingYear}
                  onChange={(e) => setGeneratingYear(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {[2023, 2024, 2025].map(year => (
                    <option key={year} value={year.toString()}>
                      {year}-{year + 1}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="bg-primary text-primary-foreground px-6"
              >
                {isGenerating ? 'Génération...' : '✨ Générer'}
              </Button>
            </div>
          </div>
          <div className="text-4xl">📋</div>
        </div>
      </div>

      {/* Reports List */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Rapports générés</h2>

        {loadingReports ? (
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Chargement des rapports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 rounded-lg border border-border bg-card text-center">
            <p className="text-muted-foreground mb-4">Aucun rapport généré pour le moment</p>
            <p className="text-sm text-muted-foreground mb-6">
              Créez votre premier rapport en remplissant le formulaire ci-dessus
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reports.map(report => (
              <ReportCard
                key={report.id}
                id={report.id}
                title={report.titre || `Rapport ${report.anneeAcademique}`}
                academicYear={report.anneeAcademique}
                generatedDate={report.createdAt}
                status={report.status}
                pageCount={report.pageCount}
                onDownload={() => handleDownloadReport(report.id)}
                onDelete={() => handleDeleteReport(report.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
