'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ProfilePage() {
  const { user, token, loading, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profile, setProfile] = useState(user);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    departement: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user);
      setFormData({
        nom: user.nom,
        prenom: user.prenom,
        email: user.email,
        departement: ''
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setEditMode(false);
        const updatedUser = { ...user, ...updatedProfile, ...formData };
        setProfile(updatedUser as any);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      'enseignant': 'Enseignant',
      'chef_departement': 'Chef de Département',
      'admin': 'Administrateur',
      'super_admin': 'Super Administrateur'
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link href="/dashboard" className="text-primary hover:text-primary/80 text-sm mb-2 inline-block">
            ← Retour
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Mon Profil</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gérez vos informations personnelles
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Informations Personnelles</CardTitle>
                <CardDescription>
                  Vos informations de compte et de profil
                </CardDescription>
              </div>
              {!editMode && (
                <Button
                  onClick={() => setEditMode(true)}
                  variant="outline"
                  className="border-border hover:bg-secondary"
                >
                  Modifier
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {editMode ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Prénom</label>
                      <Input
                        value={formData.prenom}
                        onChange={(e) =>
                          setFormData({ ...formData, prenom: e.target.value })
                        }
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
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      type="email"
                      value={formData.email}
                      disabled
                      className="bg-muted border-border"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      {isSaving ? 'Enregistrement...' : 'Enregistrer'}
                    </Button>
                    <Button
                      onClick={() => setEditMode(false)}
                      variant="outline"
                      className="border-border hover:bg-secondary"
                    >
                      Annuler
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Prénom</p>
                      <p className="font-medium text-foreground">{profile?.prenom}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nom</p>
                      <p className="font-medium text-foreground">{profile?.nom}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-foreground">{profile?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Rôle</p>
                    <p className="font-medium text-foreground">{getRoleLabel(profile?.role || '')}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres du Compte</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Authentification à Deux Facteurs</p>
                <p className="text-sm text-muted-foreground">
                  Renforcez la sécurité de votre compte
                </p>
              </div>
              <Button variant="outline" className="border-border hover:bg-secondary" disabled>
                À Venir
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div>
                <p className="font-medium text-foreground">Préférences de Notification</p>
                <p className="text-sm text-muted-foreground">
                  Gérez vos notifications par email
                </p>
              </div>
              <Button variant="outline" className="border-border hover:bg-secondary" disabled>
                À Venir
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-destructive rounded-lg bg-destructive/5">
              <div>
                <p className="font-medium text-destructive">Déconnexion</p>
                <p className="text-sm text-muted-foreground">
                  Terminez votre session
                </p>
              </div>
              <Button
                onClick={() => {
                  logout();
                  window.location.href = '/login';
                }}
                className="bg-destructive hover:bg-destructive/90 text-white"
              >
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
