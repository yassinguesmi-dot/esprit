'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => Promise<void>;
  isLoading?: boolean;
  initialData?: Partial<ActivityFormData>;
  onCancel?: () => void;
}

export interface ActivityFormData {
  titre: string;
  typeActivite: string;
  dateDebut: string;
  dateFin: string;
  heures: number;
  description: string;
}

const activityTypes = [
  { value: 'enseignement', label: 'Enseignement', icon: '📚' },
  { value: 'recherche', label: 'Recherche Scientifique', icon: '🔬' },
  { value: 'supervision', label: 'Encadrement & Jurys', icon: '👥' },
  { value: 'jury', label: 'Jury', icon: '⚖️' },
  { value: 'conference', label: 'Conférence', icon: '🎤' },
  { value: 'responsabilite', label: 'Responsabilités Académiques', icon: '📋' },
  { value: 'surveillance', label: 'Surveillance d\'Examen', icon: '👁️' },
  { value: 'evenement', label: 'Événement Scientifique', icon: '🎉' },
];

export function ActivityForm({
  onSubmit,
  isLoading = false,
  initialData,
  onCancel,
}: ActivityFormProps) {
  const [formData, setFormData] = useState<ActivityFormData>({
    titre: initialData?.titre || '',
    typeActivite: initialData?.typeActivite || 'enseignement',
    dateDebut: initialData?.dateDebut || new Date().toISOString().split('T')[0],
    dateFin: initialData?.dateFin || new Date().toISOString().split('T')[0],
    heures: initialData?.heures || 0,
    description: initialData?.description || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'heures' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  const selectedType = activityTypes.find(t => t.value === formData.typeActivite);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Activity Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-4">
          Type d'Activité
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {activityTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, typeActivite: type.value }))}
              className={`p-4 rounded-lg border-2 transition-all text-center cursor-pointer ${
                formData.typeActivite === type.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <div className="text-2xl mb-2">{type.icon}</div>
              <div className="text-xs font-medium text-foreground line-clamp-2">{type.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Activity Title */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Titre de l'Activité *
        </label>
        <Input
          type="text"
          name="titre"
          value={formData.titre}
          onChange={handleChange}
          placeholder="Ex: Cours de Programmation Web"
          required
          className="bg-background border-border"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-semibold text-foreground mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Décrivez les détails de votre activité..."
          rows={4}
          className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Dates and Hours */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Date de Début *
          </label>
          <Input
            type="date"
            name="dateDebut"
            value={formData.dateDebut}
            onChange={handleChange}
            required
            className="bg-background border-border"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Date de Fin *
          </label>
          <Input
            type="date"
            name="dateFin"
            value={formData.dateFin}
            onChange={handleChange}
            required
            className="bg-background border-border"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-foreground mb-2">
            Heures Déclarées *
          </label>
          <Input
            type="number"
            name="heures"
            value={formData.heures}
            onChange={handleChange}
            min="0"
            step="0.5"
            required
            className="bg-background border-border"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !formData.titre}
          className="flex-1 bg-primary text-primary-foreground"
        >
          {isLoading ? 'Sauvegarde en cours...' : 'Sauvegarder l\'Activité'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="border-border"
          onClick={() => (onCancel ? onCancel() : window.history.back())}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
