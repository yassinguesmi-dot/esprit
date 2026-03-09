interface ReportCardProps {
  id: string;
  title: string;
  academicYear: string;
  generatedDate: string;
  status: 'draft' | 'ready' | 'archived';
  onDownload: () => Promise<void>;
  onDelete?: () => Promise<void>;
  isLoading?: boolean;
  pageCount?: number;
}

const statusConfig = {
  draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-700', icon: '✏️' },
  ready: { label: 'Prêt', color: 'bg-green-100 text-green-700', icon: '✓' },
  archived: { label: 'Archivé', color: 'bg-blue-100 text-blue-700', icon: '📦' },
};

export function ReportCard({
  id,
  title,
  academicYear,
  generatedDate,
  status,
  onDownload,
  onDelete,
  isLoading,
  pageCount,
}: ReportCardProps) {
  const config = statusConfig[status];
  const date = new Date(generatedDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-all duration-300">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="text-3xl">📄</div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Année académique {academicYear}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.color}`}>
          {config.icon} {config.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div>
          <p className="text-muted-foreground mb-0.5">Généré le</p>
          <p className="font-medium text-foreground">{date}</p>
        </div>
        {pageCount && (
          <div>
            <p className="text-muted-foreground mb-0.5">Pages</p>
            <p className="font-medium text-foreground">{pageCount}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onDownload}
          disabled={isLoading}
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Téléchargement...' : '⬇️ Télécharger'}
        </button>
        {onDelete && (
          <button
            onClick={onDelete}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
}
