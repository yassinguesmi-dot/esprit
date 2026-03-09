# Scripts SQL - ESPRIT Activities Platform

Ce dossier contient tous les scripts SQL nécessaires pour initialiser et configurer la base de données PostgreSQL.

## 📋 Ordre d'Exécution

**IMPORTANT** : Les scripts doivent être exécutés dans cet ordre précis :

### 1. `01-create-schema.sql`
**Première exécution obligatoire**

Crée la structure de base :
- Tables fondamentales : `users`, `departments`, `roles`
- Tables de base : `activities`, `reports`, `notifications`
- Relations de base et contraintes
- Indexes initiaux

```bash
psql -U esprit_user -d esprit_activities -f scripts/01-create-schema.sql
```

### 2. `02-seed-data.sql`
**Deuxième exécution**

Insère les données de base nécessaires :
- Départements (Informatique, Business, etc.)
- Rôles (enseignant, chef_departement, admin, super_admin)
- Utilisateurs de test
- Données de démonstration initiales

```bash
psql -U esprit_user -d esprit_activities -f scripts/02-seed-data.sql
```

### 3. `03-extended-schema.sql`
**Nouvelle extension - Schéma complet**

Étend le schéma avec toutes les fonctionnalités de la plateforme :
- **Catalogue académique** : `formations`, `classes`, `modules`
- **Activités d'enseignement** : `teaching_activities`
- **Encadrement** : `supervision_activities` (PFE, Mémoire, Stage, Thèse)
- **Recherche** : `research_publications` (avec indexation et quartiles)
- **Examens** : `exam_supervisions`
- **Responsabilités** : `academic_responsibilities`
- **Workflow** : `validations`, `workflow_states`
- **Calculs** : `performance_indicators`, `primes`, `prime_rules`
- **Students** : `students` pour les encadrements
- **Jury** : `jury_participations`
- **Événements** : `scientific_events`, `event_participations`
- **Projets** : `research_projects`, `project_participations`

Inclut également :
- Vue matérialisée `comprehensive_activities` pour agrégation rapide
- Triggers pour mise à jour automatique
- Indexes optimisés pour performance
- Contraintes d'intégrité avancées

```bash
psql -U esprit_user -d esprit_activities -f scripts/03-extended-schema.sql
```

### 4. `04-extended-seed-data.sql`
**Données de test complètes**

Peuple la base avec des données réalistes pour tests et démonstration :
- 7 formations (Licence → Doctorat)
- 18 modules de cours
- 10 classes
- 80 étudiants avec emails
- Règles de calcul des primes (`prime_rules`)
- Données historiques 2023-2024

```bash
psql -U esprit_user -d esprit_activities -f scripts/04-extended-seed-data.sql
```

---

## 🚀 Commandes Rapides

### Installation complète

```bash
# Créer la base de données
createdb -U postgres esprit_activities

# Créer l'utilisateur
psql -U postgres -c "CREATE USER esprit_user WITH ENCRYPTED PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE esprit_activities TO esprit_user;"

# Exécuter tous les scripts dans l'ordre
cd scripts
psql -U esprit_user -d esprit_activities -f 01-create-schema.sql
psql -U esprit_user -d esprit_activities -f 02-seed-data.sql
psql -U esprit_user -d esprit_activities -f 03-extended-schema.sql
psql -U esprit_user -d esprit_activities -f 04-extended-seed-data.sql
```

### Réinitialisation complète

```bash
# ATTENTION : Cela supprimera toutes les données !
dropdb -U postgres esprit_activities
createdb -U postgres esprit_activities
psql -U postgres esprit_activities -c "GRANT ALL PRIVILEGES ON DATABASE esprit_activities TO esprit_user;"

# Réexécuter les scripts
cd scripts
for script in 01-create-schema.sql 02-seed-data.sql 03-extended-schema.sql 04-extended-seed-data.sql; do
  psql -U esprit_user -d esprit_activities -f $script
done
```

---

## 📊 Contenu des Scripts

### 01-create-schema.sql (Base)
- Tables : `departments`, `users`, `roles`, `activities`, `reports`, `notifications`
- Environ 15 tables de base
- Relations fondamentales

### 02-seed-data.sql (Données de base)
- 5 départements
- 4 rôles système
- 5-10 utilisateurs de test
- Données minimales pour démarrer

### 03-extended-schema.sql (Extension complète)
- **+15 nouvelles tables** :
  - `formations` : Programmes académiques
  - `classes` : Groupes d'étudiants
  - `modules` : Cours et matières
  - `students` : Étudiants pour encadrement
  - `teaching_activities` : Heures d'enseignement détaillées
  - `supervision_activities` : PFE, Mémoires, Stages, Thèses
  - `research_publications` : Articles, conférences, livres
  - `exam_supervisions` : Surveillances d'examens
  - `academic_responsibilities` : Rôles administratifs
  - `validations` : Historique de validation
  - `workflow_states` : États du workflow
  - `performance_indicators` : Métriques calculées
  - `primes` : Historique des primes
  - `prime_rules` : Règles de calcul
  - Et plus...

- **Vue matérialisée** `comprehensive_activities`
- **+30 indexes** pour performance
- **Triggers** pour mise à jour automatique des timestamps
- **Contraintes** d'intégrité référentielle

### 04-extended-seed-data.sql (Données de test)
- 7 formations complètes (3LI, 4GL, Master BI, etc.)
- 18 modules réalistes
- 10 classes
- 80 étudiants avec emails ESPRIT
- Règles de primes configurables
- Données couvrant l'année 2023-2024

---

## 🔧 Vérification

Après l'exécution, vérifier que tout est bien créé :

```sql
-- Lister toutes les tables
\dt

-- Compter les tables
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';
-- Devrait retourner environ 30 tables

-- Vérifier les données
SELECT COUNT(*) FROM users;        -- Au moins 5 utilisateurs
SELECT COUNT(*) FROM formations;   -- 7 formations
SELECT COUNT(*) FROM modules;      -- 18 modules
SELECT COUNT(*) FROM students;     -- 80 étudiants

-- Vérifier les indexes
SELECT tablename, indexname FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

---

## 🐛 Dépannage

### Erreur "relation already exists"

Si vous réexécutez un script, vous verrez cette erreur. Solutions :

1. **Réinitialiser complètement** (recommandé pour dev) :
```bash
dropdb esprit_activities && createdb esprit_activities
```

2. **Supprimer seulement certaines tables** :
```sql
DROP TABLE IF EXISTS teaching_activities CASCADE;
DROP TABLE IF EXISTS supervision_activities CASCADE;
-- etc.
```

### Erreur de permissions

```sql
-- Donner toutes les permissions à l'utilisateur
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO esprit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO esprit_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO esprit_user;
```

### Erreur "role does not exist"

```bash
# Créer l'utilisateur
psql -U postgres -c "CREATE USER esprit_user WITH ENCRYPTED PASSWORD 'your_password';"
```

---

## 📝 Migrations Futures

Pour ajouter de nouvelles fonctionnalités, créer :

- `05-migration-feature-name.sql`
- `06-migration-another-feature.sql`
- etc.

Format suggéré :
```sql
-- Migration: Description de la migration
-- Date: YYYY-MM-DD
-- Author: Nom

-- Add new tables
CREATE TABLE IF NOT EXISTS new_table (...);

-- Add new columns to existing tables
ALTER TABLE existing_table ADD COLUMN IF NOT EXISTS new_column VARCHAR(100);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_new_table_column ON new_table(column);

-- Insert seed data if needed
INSERT INTO new_table (col1, col2) VALUES ('val1', 'val2')
ON CONFLICT DO NOTHING;
```

---

## 📚 Documentation Complémentaire

- **Schéma ERD** : Voir `docs/database-schema.pdf` (à créer)
- **API Documentation** : Voir `../API.md`
- **Guide général** : Voir `../README.md`

---

**Note** : Ces scripts sont conçus pour PostgreSQL 14+. Certaines fonctionnalités peuvent nécessiter des adaptations pour d'autres versions.
