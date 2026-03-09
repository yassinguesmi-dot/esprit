'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { EspritLogo } from '@/components/EspritLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

const PUBLIC_ROUTES = ['/', '/login', '/register'];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  if (isPublic) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <div className="lg:ml-64 min-h-screen bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_srgb,var(--background)_92%,var(--muted))_100%)]">
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="h-2 w-full bg-[linear-gradient(90deg,#000000_0%,#6b7280_70%,#e30613_100%)] dark:bg-[linear-gradient(90deg,#e5e7eb_0%,#6b7280_70%,#e30613_100%)]" />
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <EspritLogo compact className="hover:opacity-90" />
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                  Honoris United Universities
                </p>
                <p className="text-sm font-medium text-foreground">Plateforme académique ESPRIT</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </>
  );
}
