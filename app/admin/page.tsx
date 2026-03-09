'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface User {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  role: string;
  departement: string;
  createdAt: string;
  lastLogin: string;
}

export default function AdminPage() {
  const { user, token, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    nom: '',
    prenom: '',
    role: 'enseignant',
    departement: ''
  });
  const [isAdding, setIsAdding] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!loading && user && !['admin', 'super_admin'].includes(user.role)) {
      window.location.href = '/dashboard';
    }
  }, [user, loading]);

  useEffect(() => {
    if (token && !loading) {
      fetchUsers();
    }
  }, [token, loading]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();
        setUsers([data.user, ...users]);
        setFormData({
          email: '',
          nom: '',
          prenom: '',
          role: 'enseignant',
          departement: ''
        });
        setShowAddUser(false);

        // Show temporary password
        alert(`Utilisateur créé avec succès!\nMot de passe temporaire: ${data.tempPassword}`);
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.error}`);
      }
    } catch (error) {
      console.error('Failed to add user:', error);
      alert('Une erreur est survenue');
    } finally {
      setIsAdding(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'enseignant': 'Enseignant',
      'chef_departement': 'Chef de Département',
      'admin': 'Administrateur',
      'super_admin': 'Super Administrateur'
    };
    return labels[role] || role;
  };

  if (loading || loadingUsers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <div>
            <Link href="/dashboard" className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">
              ← Retour
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Administration</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gérez les utilisateurs et les paramètres de la plateforme
            </p>
          </div>
          <Button
            onClick={() => setShowAddUser(!showAddUser)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            + Ajouter Utilisateur
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add User Form */}
        {showAddUser && (
          <Card className="mb-8 border-primary/20 shadow-lg">
            <CardHeader>
              <CardTitle>Ajouter un Nouvel Utilisateur</CardTitle>
              <CardDescription>
                Créez un nouveau compte utilisateur
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Prénom</label>
                    <Input
                      value={formData.prenom}
                      onChange={(e) =>
                        setFormData({ ...formData, prenom: e.target.value })
                      }
                      required
                      className="bg-input border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Nom</label>
                    <Input
                      value={formData.nom}
                      onChange={(e) =>
                        setFormData({ ...formData, nom: e.target.value })
                      }
                      required
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Email</label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                    className="bg-input border-border"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Rôle</label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        setFormData({ ...formData, role: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-input border border-border rounded-md text-foreground text-sm"
                    >
                      <option value="enseignant">Enseignant</option>
                      <option value="chef_departement">Chef de Département</option>
                      <option value="admin">Administrateur</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Département</label>
                    <Input
                      value={formData.departement}
                      onChange={(e) =>
                        setFormData({ ...formData, departement: e.target.value })
                      }
                      className="bg-input border-border"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isAdding}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    {isAdding ? 'Création...' : 'Créer Utilisateur'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddUser(false)}
                    className="border-border hover:bg-secondary"
                  >
                    Annuler
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Utilisateurs ({users.length})</CardTitle>
              <CardDescription>
                Liste de tous les utilisateurs de la plateforme
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Utilisateur
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Email
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Rôle
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Département
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Inscription
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-foreground">
                        Dernière Connexion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-foreground">
                          {u.prenom} {u.nom}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded text-xs bg-primary/10 text-primary font-medium">
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {u.departement || '-'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleDateString('fr-FR')
                            : 'Jamais'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
