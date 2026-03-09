interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'secondary' | 'accent' | 'destructive';
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'primary',
}: StatsCardProps) {
  const colorClasses = {
    primary: 'border-l-4 border-[#e30613] bg-card shadow-[0_18px_40px_-24px_rgba(0,0,0,0.22)] hover:shadow-[0_20px_50px_-20px_rgba(227,6,19,0.28)] dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]',
    secondary: 'border-l-4 border-foreground bg-[linear-gradient(180deg,var(--card)_0%,color-mix(in_srgb,var(--card)_75%,var(--muted))_100%)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.22)] hover:shadow-[0_20px_50px_-20px_rgba(17,17,17,0.24)] dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]',
    accent: 'border-l-4 border-[#9ca3af] bg-[linear-gradient(180deg,var(--card)_0%,color-mix(in_srgb,var(--card)_82%,var(--muted))_100%)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.22)] hover:shadow-[0_20px_50px_-20px_rgba(156,163,175,0.30)] dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]',
    destructive: 'border-l-4 border-[#e30613] bg-[color:color-mix(in_srgb,var(--card)_88%,#e30613_12%)] shadow-[0_18px_40px_-24px_rgba(0,0,0,0.22)] hover:shadow-[0_20px_50px_-20px_rgba(227,6,19,0.28)] dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.6)]',
  };

  return (
    <div className={`rounded-2xl p-6 transition-all duration-200 ${colorClasses[color]} border border-border`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</p>
          <p className="text-3xl font-black text-foreground">{value}</p>
          {subtitle && (
            <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p>
          )}
          {trend && (
            <div className={`mt-3 text-sm font-bold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {trend.value}%
            </div>
          )}
        </div>
        {icon && (
          <div className="text-5xl opacity-80 ml-4">{icon}</div>
        )}
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-2">
          <span className={`text-xs font-semibold ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-muted-foreground">vs mois précédent</span>
        </div>
      )}
    </div>
  );
}
