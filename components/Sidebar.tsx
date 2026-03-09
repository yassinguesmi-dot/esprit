'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EspritLogo } from '@/components/EspritLogo';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  requiredRoles?: string[];
  badge?: number;
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/login');
    router.refresh();
  };

  if (!user || pathname === '/login' || pathname === '/register') return null;

  // Navigation items based on user role
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { label: 'Tableau de Bord', href: '/dashboard', icon: '📊' },
      { label: 'Mes Activités', href: '/activities', icon: '📝' },
      { label: 'Mes Rapports', href: '/reports', icon: '📄' },
      { label: 'Profil', href: '/profile', icon: '👤' },
    ];

    if (user.role === 'chef_departement' || user.role === 'admin' || user.role === 'super_admin') {
      baseItems.splice(2, 0, { label: 'Validations', href: '/validation', icon: '✓' });
    }

    if (user.role === 'admin' || user.role === 'super_admin') {
      baseItems.push({ label: 'Administration', href: '/admin', icon: '⚙️' });
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`${
        isCollapsed ? 'w-20' : 'w-64'
      } fixed left-0 top-0 h-screen bg-[linear-gradient(180deg,#050505_0%,#171717_100%)] text-white transition-all duration-300 z-40 overflow-y-auto border-r border-[#2b2f36] dark:bg-[linear-gradient(180deg,#020202_0%,#101114_100%)]`}
    >
      {/* Logo Section */}
      <div className="relative flex min-h-28 items-center px-4 py-4 border-b border-[#2b2f36] bg-[linear-gradient(90deg,#000000_0%,#1f2937_70%,#e30613_100%)]">
        {!isCollapsed ? (
          <EspritLogo compact theme="dark" className="min-w-0 flex-1 justify-start pr-9 hover:opacity-95" />
        ) : (
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e30613] text-lg font-bold text-white transition hover:bg-[#bf0711]"
          >
            E
          </Link>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute right-3 top-1/2 hidden -translate-y-1/2 shrink-0 rounded p-1 text-white transition hover:bg-white/10 lg:block"
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '→' : '←'}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="border-b border-[#2b2f36] bg-[#0f1115] px-4 py-3">
          <p className="text-sm font-semibold truncate text-white">
            {user.prenom} {user.nom}
          </p>
          <p className="text-xs font-medium capitalize text-[#d1d5db]">
            {user.role === 'chef_departement' ? 'Chef de Département' :
             user.role === 'super_admin' ? 'Super Admin' :
             user.role === 'admin' ? 'Administrateur' : 'Enseignant'}
          </p>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
              pathname === item.href
                ? 'bg-[#e30613] text-white shadow-[0_10px_30px_-12px_rgba(227,6,19,0.7)]'
                : 'text-[#d1d5db] hover:bg-white/8 hover:text-white'
            }`}
            title={isCollapsed ? item.label : ''}
          >
            <span className="text-lg flex-shrink-0">{item.icon}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="rounded-full bg-[#e30613] px-2 py-0.5 text-xs font-bold text-white">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </Link>
        ))}
      </nav>

      {/* Bottom Section - Logout */}
      <div className="absolute bottom-0 left-0 right-0 border-t border-[#2b2f36] bg-[linear-gradient(180deg,transparent_0%,#0f1115_100%)] p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-3 rounded-xl px-4 py-2.5 text-center text-sm font-medium text-[#d1d5db] transition hover:bg-[#e30613] hover:text-white"
        >
          <span className="text-lg">→</span>
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}
