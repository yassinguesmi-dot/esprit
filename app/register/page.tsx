'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EspritLogo } from '@/components/EspritLogo';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'enseignant'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          password: formData.password,
          role: formData.role
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      // Store token and user data
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-gray-50 to-gray-100 px-4 py-8 dark:from-[#050505] dark:via-[#0f1115] dark:to-[#151821]">
      <div className="w-full max-w-md">
        <div className="mb-4 flex justify-end">
          <ThemeToggle />
        </div>
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <EspritLogo className="mb-4" />
          <p className="text-gray-600 text-sm dark:text-gray-300">Créer un nouveau compte</p>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 dark:bg-[#0f1115]">
          <div className="bg-gradient-to-r from-black to-gray-900 px-6 py-5 border-b-2 border-red-600 dark:from-[#111111] dark:to-[#1d2430]">
            <h2 className="text-2xl font-bold text-white">Créer un compte</h2>
          </div>
          <div className="px-6 py-8">
            <p className="text-gray-600 text-sm mb-6 dark:text-gray-300">
              Inscrivez-vous pour accéder à la plateforme
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium flex items-start gap-3">
                  <span className="text-lg">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label htmlFor="prenom" className="text-sm font-semibold text-black dark:text-white">
                    Prénom
                  </label>
                  <Input
                    id="prenom"
                    name="prenom"
                    placeholder="Jean"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    className="rounded-lg h-10"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="nom" className="text-sm font-semibold text-black dark:text-white">
                    Nom
                  </label>
                  <Input
                    id="nom"
                    name="nom"
                    placeholder="Dupont"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="rounded-lg h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold text-black dark:text-white">
                  Adresse email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="rounded-lg h-10"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-semibold text-black dark:text-white">
                  Rôle
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-input border-2 border-border focus:border-red-600 focus:ring-red-600 rounded-lg text-foreground font-medium text-sm"
                >
                  <option value="enseignant">Enseignant</option>
                  <option value="chef_departement">Chef de Département</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-semibold text-black dark:text-white">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="rounded-lg h-10"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-black dark:text-white">
                  Confirmer le mot de passe
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="rounded-lg h-10"
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
                    Inscription en cours...
                  </span>
                ) : (
                  'S\'inscrire'
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600 dark:border-gray-800 dark:text-gray-300">
              Déjà inscrit?{' '}
              <Link href="/login" className="font-bold text-red-600 hover:text-red-700 transition">
                Se connecter
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
