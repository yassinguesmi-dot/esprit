'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import { ActivityCard } from '@/components/ActivityCard';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalActivities: 0,
    pendingValidation: 0,
    approvedActivities: 0,
    totalHours: 0,
  });
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      try {
        const response = await fetch('/api/activities', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const data = await response.json();

        const activities = data.activities || data || [];
        setRecentActivities(activities.slice(0, 5));

        const stats = {
          totalActivities: activities.length,
          pendingValidation: activities.filter((a: any) => a.status === 'submitted').length,
          approvedActivities: activities.filter((a: any) => a.status === 'approved' || a.status === 'validated').length,
          totalHours: activities.reduce((sum: number, a: any) => sum + (a.heures || 0), 0),
        };

        setStats(stats);
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  const isDepartmentChief = user?.role === 'chef_departement';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Tableau de Bord"
        description={`Bienvenue, ${user?.prenom} ${user?.nom}`}
        icon="📊"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Activités"
          value={stats.totalActivities}
          icon="📝"
          color="primary"
          subtitle="Déclarées cette année"
        />
        <StatsCard
          title="En Attente"
          value={stats.pendingValidation}
          icon="⏳"
          color="secondary"
          subtitle="Validations en cours"
        />
        <StatsCard
          title="Approuvées"
          value={stats.approvedActivities}
          icon="✓"
          color="accent"
          subtitle="Activités validées"
        />
        <StatsCard
          title="Heures Totales"
          value={`${stats.totalHours}h`}
          icon="⏱️"
          color="primary"
          subtitle="Temps déclaré"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activities */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Activités Récentes</h2>
            <Link href="/activities">
              <Button variant="outline" size="sm" className="border-border">
                Voir tout
              </Button>
            </Link>
          </div>

          {loadingActivities ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Chargement des activités...</p>
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="p-12 rounded-lg border border-border bg-card text-center">
              <p className="text-muted-foreground mb-4">Aucune activité déclarée pour le moment</p>
              <Link href="/activities">
                <Button className="bg-primary">Déclarer une Activité</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  id={activity.id}
                  type={activity.typeActivite}
                  title={activity.titre}
                  dateDebut={activity.dateDebut}
                  dateFin={activity.dateFin}
                  status={activity.status}
                  heures={activity.heures}
                  description={activity.description}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Actions Rapides</h2>

          <div className="space-y-3">
            <Link href="/activities">
              <Button className="w-full bg-primary text-primary-foreground justify-start gap-3 h-auto py-3">
                <span className="text-xl">📝</span>
                <div className="text-left">
                  <div className="font-semibold">Déclarer une Activité</div>
                  <div className="text-xs opacity-75">Créer une nouvelle déclaration</div>
                </div>
              </Button>
            </Link>

            <Link href="/reports">
              <Button variant="outline" className="w-full border-border justify-start gap-3 h-auto py-3">
                <span className="text-xl">📄</span>
                <div className="text-left">
                  <div className="font-semibold">Générer un Rapport</div>
                  <div className="text-xs opacity-75">Créer un rapport annuel</div>
                </div>
              </Button>
            </Link>

            {(isDepartmentChief || isAdmin) && (
              <Link href="/validation">
                <Button variant="outline" className="w-full border-border justify-start gap-3 h-auto py-3">
                  <span className="text-xl">✓</span>
                  <div className="text-left">
                    <div className="font-semibold">Valider les Activités</div>
                    <div className="text-xs opacity-75">
                      {stats.pendingValidation} en attente
                    </div>
                  </div>
                </Button>
              </Link>
            )}

            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" className="w-full border-border justify-start gap-3 h-auto py-3">
                  <span className="text-xl">⚙️</span>
                  <div className="text-left">
                    <div className="font-semibold">Administration</div>
                    <div className="text-xs opacity-75">Gérer les utilisateurs</div>
                  </div>
                </Button>
              </Link>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <h3 className="font-semibold text-foreground mb-2">💡 Conseil</h3>
            <p className="text-sm text-muted-foreground">
              Déclarez régulièrement vos activités pour maintenir un suivi à jour et faciliter la génération de rapports.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
