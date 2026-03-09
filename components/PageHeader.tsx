interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function PageHeader({
  title,
  description,
  icon,
  action,
  breadcrumbs,
}: PageHeaderProps) {
  return (
    <div className="mb-8 rounded-2xl border border-border bg-card px-6 py-5 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.22)] dark:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.6)]">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-2 mb-4 text-sm">
          {breadcrumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-2">
              {idx > 0 && <span className="text-muted-foreground">/</span>}
              <span className="text-muted-foreground hover:text-foreground transition cursor-pointer">
                {crumb.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          {icon && <div className="text-4xl drop-shadow-sm">{icon}</div>}
          <div>
            <h1 className="text-4xl font-black tracking-tight text-foreground">{title}</h1>
            <div className="mt-2 h-1 w-24 rounded-full bg-[linear-gradient(90deg,#000000_0%,#e30613_100%)]" />
            {description && (
              <p className="mt-3 font-medium text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        {action && (
          <button
            onClick={action.onClick}
            className="whitespace-nowrap rounded-xl bg-[#e30613] px-6 py-3 font-bold text-white shadow-[0_12px_30px_-12px_rgba(227,6,19,0.75)] transition-all duration-200 hover:bg-[#bf0711]"
          >
            + {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
