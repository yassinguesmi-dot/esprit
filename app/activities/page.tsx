'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { ActivityCard } from '@/components/ActivityCard';
import { ActivityForm, ActivityFormData } from '@/components/ActivityForm';
import { Button } from '@/components/ui/button';

type ViewMode = 'list' | 'create' | 'edit';

export default function ActivitiesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [editingActivity, setEditingActivity] = useState<any | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await fetch('/api/activities', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) throw new Error('Erreur de chargement');

        const data = await response.json();
        setActivities(data.activities || data || []);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des activités');
        console.error(err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [user]);

  const handleCreateActivity = async (formData: ActivityFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const isEditing = !!editingActivity;

      const response = await fetch(isEditing ? `/api/activities/${editingActivity.id}` : '/api/activities', {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error(isEditing ? 'Erreur de mise à jour' : 'Erreur de création');

      const savedActivity = await response.json();
      setActivities((prev) =>
        isEditing
          ? prev.map((activity) => activity.id === savedActivity.id ? savedActivity : activity)
          : [savedActivity, ...prev]
      );
      setEditingActivity(null);
      setViewMode('list');
    } catch (err) {
      setError(editingActivity ? 'Erreur lors de la mise à jour de l\'activité' : 'Erreur lors de la création de l\'activité');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) return;

    try {
      const response = await fetch(`/api/activities/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      if (!response.ok) throw new Error('Erreur de suppression');

      setActivities(activities.filter(a => a.id !== id));
    } catch (err) {
      setError('Erreur lors de la suppression');
      console.error(err);
    }
  };

  const filteredActivities = filterStatus === 'all'
    ? activities
    : activities.filter(a => a.status === filterStatus);

  const statuses = ['all', 'draft', 'submitted', 'validated', 'approved', 'rejected'];
  const statusLabels: Record<string, string> = {
    all: 'Toutes',
    draft: 'Brouillons',
    submitted: 'Soumises',
    validated: 'Validées',
    approved: 'Approuvées',
    rejected: 'Rejetées',
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
    <div className="space-y-6">
      {viewMode !== 'list' ? (
        <>
          <PageHeader
            title={viewMode === 'edit' ? 'Modifier une Activité' : 'Déclarer une Activité'}
            description={viewMode === 'edit' ? 'Mettez à jour votre déclaration d\'activité' : 'Créez une nouvelle déclaration d\'activité'}
            icon="📝"
          />

          <div className="bg-card border border-border rounded-lg p-8">
            <ActivityForm
              onSubmit={handleCreateActivity}
              isLoading={isSubmitting}
              initialData={editingActivity || undefined}
              onCancel={() => {
                setEditingActivity(null);
                setViewMode('list');
              }}
            />
          </div>
        </>
      ) : (
        <>
          <PageHeader
            title="Mes Activités"
            description="Gérez vos déclarations d'activités académiques"
            icon="📝"
            action={{
              label: 'Nouvelle Activité',
              onClick: () => setViewMode('create'),
            }}
          />

          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
              {error}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {statuses.map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border hover:border-primary/50'
                }`}
              >
                {statusLabels[status]}
                {status !== 'all' && (
                  <span className="ml-2 text-xs bg-background/50 px-2 py-1 rounded">
                    {activities.filter(a => a.status === status).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Activities List */}
          {loadingActivities ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Chargement des activités...</p>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 rounded-lg border border-border bg-card text-center">
              <p className="text-muted-foreground mb-4">Aucune activité {filterStatus !== 'all' ? 'avec ce statut' : 'pour le moment'}</p>
              <Button className="bg-primary" onClick={() => setViewMode('create')}>
                Créer une Activité
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredActivities.map(activity => (
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
                  onEdit={() => {
                    setEditingActivity(activity);
                    setViewMode('edit');
                  }}
                  onDelete={() => handleDeleteActivity(activity.id)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
