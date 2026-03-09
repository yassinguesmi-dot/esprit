interface UserCardProps {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  joinedDate: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onResetPassword?: () => void;
}

const roleIcons: Record<string, string> = {
  'enseignant': '👨‍🏫',
  'chef_departement': '🎓',
  'admin': '⚙️',
  'super_admin': '👑',
};

const roleLabels: Record<string, string> = {
  'enseignant': 'Enseignant',
  'chef_departement': 'Chef de Département',
  'admin': 'Administrateur',
  'super_admin': 'Super Administrateur',
};

export function UserCard({
  id,
  name,
  email,
  role,
  department,
  joinedDate,
  onEdit,
  onDelete,
  onResetPassword,
}: UserCardProps) {
  const icon = roleIcons[role] || '👤';
  const label = roleLabels[role] || role;
  const date = new Date(joinedDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl">{icon}</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground">{name}</h3>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
            {department && (
              <p className="text-xs text-muted-foreground mt-1">
                Département: {department}
              </p>
            )}
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
          {label}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4">Membre depuis {date}</p>

      <div className="flex gap-2 flex-wrap">
        {onResetPassword && (
          <button
            onClick={onResetPassword}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-secondary text-secondary-foreground hover:opacity-80 transition"
          >
            🔑 Réinitialiser
          </button>
        )}
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded border border-border hover:bg-secondary transition"
          >
            ✏️ Éditer
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex-1 px-3 py-1.5 text-xs font-medium rounded border border-destructive text-destructive hover:bg-destructive/10 transition"
          >
            🗑️ Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
