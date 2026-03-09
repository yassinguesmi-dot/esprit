'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface ValidationCardProps {
  id: string;
  userName: string;
  userEmail: string;
  activityType: string;
  title: string;
  dateDebut: string;
  dateFin: string;
  description?: string;
  onApprove: (comment: string) => Promise<void>;
  onReject: (comment: string) => Promise<void>;
  isLoading?: boolean;
}

const activityTypeIcons: Record<string, string> = {
  'enseignement': '📚',
  'recherche': '🔬',
  'supervision': '👥',
  'jury': '⚖️',
  'conference': '🎤',
  'responsabilite': '📋',
  'surveillance': '👁️',
  'evenement': '🎉',
};

export function ValidationCard({
  id,
  userName,
  userEmail,
  activityType,
  title,
  dateDebut,
  dateFin,
  description,
  onApprove,
  onReject,
  isLoading = false,
}: ValidationCardProps) {
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleApprove = async () => {
    setIsSubmitting(true);
    setAction('approve');
    try {
      await onApprove(comment);
      setComment('');
      setAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setAction('reject');
    try {
      await onReject(comment);
      setComment('');
      setAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const icon = (activityTypeIcons as any)[activityType] || '📌';

  return (
    <div className="border border-border rounded-lg bg-card overflow-hidden hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {userName} ({userEmail})
            </p>
            <div className="flex items-center gap-2">
              <span className="text-2xl">{icon}</span>
              <h3 className="font-semibold text-foreground line-clamp-1">{title}</h3>
            </div>
          </div>
          <div className="flex-shrink-0 px-3 py-1 rounded-full bg-primary/20 border border-primary/30">
            <span className="text-xs font-semibold text-primary capitalize">
              {activityType}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Activity Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Période</p>
            <p className="font-medium text-foreground">
              {startDate} → {endDate}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Email</p>
            <p className="font-medium text-foreground break-all">{userEmail}</p>
          </div>
        </div>

        {description && (
          <div>
            <p className="text-muted-foreground text-sm mb-2">Description</p>
            <p className="text-foreground bg-background/50 rounded p-3 text-sm">
              {description}
            </p>
          </div>
        )}

        {/* Comments Section */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Commentaires de validation
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ajoutez un commentaire pour l'enseignant..."
            rows={3}
            className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleApprove}
            disabled={isSubmitting || isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>✓</span>
            {isSubmitting && action === 'approve' ? 'Approbation...' : 'Approuver'}
          </button>
          <button
            onClick={handleReject}
            disabled={isSubmitting || isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>✗</span>
            {isSubmitting && action === 'reject' ? 'Rejet...' : 'Rejeter'}
          </button>
        </div>
      </div>
    </div>
  );
}
