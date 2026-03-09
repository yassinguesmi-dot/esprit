'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ActivityCardProps {
  id: string;
  type: string;
  title: string;
  dateDebut: string;
  dateFin: string;
  status: 'draft' | 'submitted' | 'validated' | 'approved' | 'rejected';
  heures?: number;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700 border border-gray-300', icon: '📝' },
  submitted: { label: 'Soumis', color: 'bg-yellow-100 text-yellow-700 border border-yellow-300', icon: '📤' },
  validated: { label: 'Validé', color: 'bg-green-100 text-green-700 border border-green-300', icon: '✓' },
  approved: { label: 'Approuvé', color: 'bg-green-100 text-green-700 border border-green-300', icon: '✓✓' },
  rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-700 border border-red-300', icon: '✗' },
};

const activityTypeIcons = {
  'enseignement': '📚',
  'recherche': '🔬',
  'supervision': '👥',
  'jury': '⚖️',
  'conference': '🎤',
  'responsabilite': '📋',
  'surveillance': '👁️',
  'evenement': '🎉',
};

export function ActivityCard({
  id,
  type,
  title,
  dateDebut,
  dateFin,
  status,
  heures,
  description,
  onEdit,
  onDelete,
}: ActivityCardProps) {
  const config = statusConfig[status];
  const icon = (activityTypeIcons as any)[type] || '📌';

  const startDate = new Date(dateDebut).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const endDate = new Date(dateFin).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="p-5 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{icon}</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${config.color}`}>
              {config.label}
            </span>
          </div>
          <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-3 capitalize">{type}</p>
          
          {description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
            <span>📅 {startDate}</span>
            {heures && <span>⏱️ {heures}h</span>}
          </div>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          {onEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              className="border-border"
            >
              Éditer
            </Button>
          )}
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              className="border-destructive text-destructive hover:bg-destructive/10"
            >
              Supprimer
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
