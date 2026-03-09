'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsData {
  totalActivities: number;
  approvedActivities: number;
  pendingActivities: number;
  totalHours: number;
  averageHoursPerActivity: number;
  activitiesByType: Record<string, number>;
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/analytics', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });

        if (!response.ok) throw new Error('Erreur de chargement');

        const analyticsData = await response.json();
        setData(analyticsData);
      } catch (err) {
        setError('Erreur lors du chargement des données analytiques');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-muted-foreground">Chargement...</div>;
  if (error) return <div className="text-destructive">{error}</div>;
  if (!data) return null;

  const stats = [
    {
      label: 'Total Activités',
      value: data.totalActivities,
      icon: '📋',
      color: 'text-blue-600',
    },
    {
      label: 'Approuvées',
      value: data.approvedActivities,
      icon: '✓',
      color: 'text-green-600',
    },
    {
      label: 'En attente',
      value: data.pendingActivities,
      icon: '⏳',
      color: 'text-yellow-600',
    },
    {
      label: 'Total Heures',
      value: data.totalHours,
      icon: '⏰',
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="border-border">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Activités par Type</CardTitle>
          <CardDescription>Distribution des activités par catégorie</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(data.activitiesByType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm capitalize">{type}</span>
                <div className="flex items-center gap-2">
                  <div className="bg-primary/20 rounded-full px-3 py-1 text-sm font-medium">
                    {count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
