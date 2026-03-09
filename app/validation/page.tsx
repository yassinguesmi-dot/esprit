'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { ValidationCard } from '@/components/ValidationCard';
import { Button } from '@/components/ui/button';

interface ActivityToValidate {
  id: string;
  userName: string;
  userEmail: string;
  typeActivite: string;
  titre: string;
  dateDebut: string;
  dateFin: string;
  description: string;
}

export default function ValidationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<ActivityToValidate[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }

    if (
      user &&
      user.role !== 'chef_departement' &&
      user.role !== 'admin' &&
      user.role !== 'super_admin'
    ) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    const fetchActivities = async () => {
      try {
        setLoadingActivities(true);
        const response = await fetch('/api/validations', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) throw new Error('Erreur de chargement');

        const data = await response.json();
        setActivities(data.activities || []);
        setError(null);
      } catch (err) {
        setError('Erreur lors du chargement des validations');
        console.error(err);
      } finally {
        setLoadingActivities(false);
      }
    };

    fetchActivities();
  }, [user]);

  const handleApprove = async (id: string, comment: string) => {
    try {
      const response = await fetch('/api/validations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          activityId: id,
          status: 'approved',
          comment,
        }),
      });

      if (!response.ok) throw new Error('Erreur d\'approbation');

      setActivities(activities.filter(a => a.id !== id));
      setSuccessMessage('Activité approuvée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors de l\'approbation');
      console.error(err);
    }
  };

  const handleReject = async (id: string, comment: string) => {
    try {
      const response = await fetch('/api/validations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          activityId: id,
          status: 'rejected',
          comment,
        }),
      });

      if (!response.ok) throw new Error('Erreur de rejet');

      setActivities(activities.filter(a => a.id !== id));
      setSuccessMessage('Activité rejetée avec succès');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError('Erreur lors du rejet');
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
    <div className="space-y-6">
      <PageHeader
        title="Validations en Attente"
        description="Examinez et approuvez les activités déclarées par les enseignants"
        icon="✓"
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm font-medium text-muted-foreground mb-1">En attente</p>
          <p className="text-3xl font-bold text-primary">{activities.length}</p>
        </div>
      </div>

      {/* Validations List */}
      {loadingActivities ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Chargement des validations...</p>
        </div>
      ) : activities.length === 0 ? (
        <div className="p-12 rounded-lg border border-border bg-card text-center">
          <p className="text-muted-foreground mb-4">Aucune activité en attente de validation</p>
          <Button variant="outline" className="border-border" onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {activities.map(activity => (
            <ValidationCard
              key={activity.id}
              id={activity.id}
              userName={activity.userName}
              userEmail={activity.userEmail}
              activityType={activity.typeActivite}
              title={activity.titre}
              dateDebut={activity.dateDebut}
              dateFin={activity.dateFin}
              description={activity.description}
              onApprove={(comment) => handleApprove(activity.id, comment)}
              onReject={(comment) => handleReject(activity.id, comment)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
