'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EspritLogo } from '@/components/EspritLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 px-4 dark:from-[#050505] dark:via-[#0f1115] dark:to-[#151821]">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <EspritLogo className="mb-4" />
          <p className="text-gray-600 text-sm dark:text-gray-300">Plateforme de Suivi des Activités</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 dark:bg-[#0f1115]">
          <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-5 border-b-2 border-red-600 dark:from-[#111111] dark:to-[#1d2430]">
            <h2 className="text-2xl font-bold text-white">Connexion</h2>
          </div>
          <div className="px-6 py-8">
            <p className="text-gray-600 text-sm mb-6 dark:text-gray-300">
              Entrez vos identifiants pour accéder à votre espace
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-black dark:text-white">
                  Adresse email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="rounded-lg h-11 font-medium"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-black dark:text-white">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="rounded-lg h-11 font-medium"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-lg transition-all duration-200 shadow-lg hover:shadow-red-600/30 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin">⏳</span>
                    Connexion en cours...
                  </span>
                ) : (
                  'Se connecter'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
              Pas encore de compte?{' '}
              <Link href="/register" className="font-bold text-red-600 hover:text-red-700 transition">
                S'inscrire
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8 font-medium dark:text-gray-400">
          © 2024 ESPRIT. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}
