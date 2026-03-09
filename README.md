# 📚 Plateforme Intelligente de Suivi des Activités Académiques

Système complet de gestion et suivi des activités académiques pour ESPRIT School of Business.

## 🎯 Fonctionnalités

### ✅ Gestion des Activités
- **Enseignement** : Suivi détaillé des heures de cours (CM, TD, TP)
- **Encadrement** : Gestion des PFE, Mémoires, Stages, Thèses
- **Recherche** : Publications scientifiques avec indexation (Scopus, WoS)
- **Examens** : Surveillance et correction des examens
- **Responsabilités** : Rôles administratifs et académiques

### 🔄 Workflow de Validation
- Soumission des activités par les enseignants
- Validation hiérarchique (Chef de département → Admin)
- Système de notifications automatiques
- Historique complet des validations

### 📊 Calculs Automatiques
- Agrégation automatique des heures et activités
- Calcul des indicateurs de performance
- Génération des primes selon règles configurables
- Dashboard analytique

### 📄 Rapports & Exports
- Génération PDF des rapports annuels
- Export Excel des données
- Statistiques détaillées par département
- Synthèse globale des activités

## 🚀 Installation

### Prérequis
```bash
Node.js >= 18.x
PostgreSQL >= 14.x
pnpm >= 8.x
```

### 1. Installation des dépendances
```bash
pnpm install
```

### 2. Configuration de la base de données

#### Créer la base de données
```sql
CREATE DATABASE esprit_activities;
CREATE USER esprit_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE esprit_activities TO esprit_user;
```

#### Exécuter les scripts SQL dans l'ordre
```bash
psql -U esprit_user -d esprit_activities -f scripts/01-create-schema.sql
psql -U esprit_user -d esprit_activities -f scripts/02-seed-data.sql
psql -U esprit_user -d esprit_activities -f scripts/03-extended-schema.sql
psql -U esprit_user -d esprit_activities -f scripts/04-extended-seed-data.sql
```

### 3. Configuration des variables d'environnement

Créer un fichier `.env.local` :
```env
# Database
DATABASE_URL=postgresql://esprit_user:your_secure_password@localhost:5432/esprit_activities

# JWT
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# Application
NEXT_PUBLIC_APP_NAME=ESPRIT Activities
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (optionnel pour notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@esprit.tn
SMTP_PASSWORD=your_app_password
```

### 4. Lancer l'application

#### Mode développement
```bash
pnpm dev
```
L'application sera accessible sur http://localhost:3000

#### Mode production
```bash
pnpm build
pnpm start
```

## 📁 Structure du Projet

```
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── teaching/             # Gestion enseignement
│   │   ├── supervision/          # Gestion encadrement
│   │   ├── research/             # Gestion recherche
│   │   ├── exams/                # Gestion examens
│   │   ├── responsibilities/     # Gestion responsabilités
│   │   ├── workflow/             # Système de validation
│   │   ├── calculations/         # Calculs automatiques
│   │   ├── reports/              # Génération rapports
│   │   └── notifications/        # Centre de notifications
│   ├── dashboard/                # Pages dashboard
│   ├── activities/               # Pages activités
│   └── login/                    # Authentification
├── components/                   # Composants React
├── lib/                          # Utilitaires
│   ├── auth.ts                   # JWT & permissions
│   ├── db.ts                     # Connexion PostgreSQL
│   ├── pdf-generator.ts          # Génération PDF
│   └── bonus-calculator.ts       # Calcul primes
└── scripts/                      # Scripts SQL
```

## 🔌 Documentation API

### 🔐 Authentication

Toutes les routes API requièrent un token JWT dans le header :
```
Authorization: Bearer <token>
```

#### POST /api/auth/login
```json
{
  "email": "nessrine.tlili@esprit.tn",
  "password": "password123"
}
```

#### POST /api/auth/register
```json
{
  "name": "Nessrine Tlili",
  "email": "nessrine.tlili@esprit.tn",
  "password": "password123",
  "department_id": 1,
  "role": "enseignant"
}
```

### 📚 Teaching Activities

#### GET /api/teaching
Paramètres query :
- `academic_year` : Ex: "2023-2024"
- `semester` : 1 ou 2
- `status` : draft, pending, validated, rejected

#### POST /api/teaching
```json
{
  "formation_id": 1,
  "class_id": 5,
  "module_id": 12,
  "activity_type": "CM",
  "planned_hours": 42,
  "completed_hours": 40,
  "academic_year": "2023-2024",
  "semester": 1
}
```

#### PUT /api/teaching
```json
{
  "id": 1,
  "completed_hours": 42,
  "status": "pending"
}
```

### 👨‍🎓 Supervision Activities

#### GET /api/supervision
Paramètres query :
- `academic_year` : Ex: "2023-2024"
- `type` : PFE, Memoire, Stage, These
- `status` : in_progress, defended, canceled

#### POST /api/supervision
```json
{
  "student_id": 15,
  "formation_id": 3,
  "supervision_type": "PFE",
  "title": "Développement d'une application mobile",
  "role": "Encadrant",
  "start_date": "2023-09-01",
  "defense_date": "2024-06-15",
  "academic_year": "2023-2024"
}
```

### 📖 Research Activities

#### GET /api/research
Paramètres query :
- `academic_year` : Ex: "2023"
- `publication_type` : Article, Conference, Book, Chapter

#### POST /api/research
```json
{
  "publication_type": "Article",
  "title": "Machine Learning in Education",
  "journal_conference": "Journal of Educational Technology",
  "indexation": "Scopus",
  "quartile": "Q1",
  "impact_factor": 3.45,
  "publication_date": "2023-06-15",
  "doi": "10.1234/jet.2023.456"
}
```

#### DELETE /api/research?id=1

### 📝 Exam Supervisions

#### GET /api/exams
Paramètres query :
- `academic_year` : Ex: "2023-2024"
- `semester` : 1 ou 2
- `session` : Principale, Controle, Rattrapage

#### POST /api/exams
```json
{
  "module_id": 12,
  "class_id": 5,
  "exam_date": "2024-01-15",
  "session": "Principale",
  "room": "A201",
  "student_count": 45,
  "hours": 3,
  "academic_year": "2023-2024",
  "semester": 1
}
```

### 🏛️ Academic Responsibilities

#### GET /api/responsibilities
Paramètres query :
- `academic_year` : Ex: "2023-2024"
- `responsibility_type` : Maitre_Stage, Coordinateur_Module, etc.

#### POST /api/responsibilities
```json
{
  "responsibility_type": "Coordinateur_Module",
  "module_id": 12,
  "hours_allocated": 40,
  "start_date": "2023-09-01",
  "end_date": "2024-06-30",
  "academic_year": "2023-2024"
}
```

#### DELETE /api/responsibilities?id=1

### 🔄 Workflow Management

#### POST /api/workflow
Actions disponibles :
- **submit** : Soumettre pour validation
- **validate** : Valider (chef département+)
- **reject** : Rejeter
- **request_revision** : Demander révision

```json
{
  "action": "submit",
  "activity_type": "teaching",
  "activity_id": 1
}
```

```json
{
  "action": "validate",
  "activity_type": "teaching",
  "activity_id": 1,
  "comment": "Validé - RAS"
}
```

#### GET /api/workflow?activity_type=teaching&activity_id=1
Retourne l'historique des validations.

### 📊 Calculations & Performance

#### GET /api/calculations?academic_year=2023-2024
Retourne les indicateurs de performance.

#### POST /api/calculations
```json
{
  "academic_year": "2023-2024"
}
```
Calcule automatiquement :
- Total heures enseignement
- Nombre encadrements par type
- Publications avec indexation
- Heures examens et responsabilités
- Score de performance pondéré
- Montant des primes

### 📄 Report Generation

#### POST /api/reports/generate
```json
{
  "academic_year": "2023-2024"
}
```
Génère un rapport PDF complet incluant :
- Informations utilisateur
- Toutes les activités par catégorie
- Tableaux récapitulatifs
- Statistiques détaillées

#### GET /api/reports
Liste tous les rapports générés.

#### GET /api/reports/[id]/download
Télécharge un rapport spécifique.

### 📈 Analytics

#### GET /api/analytics
Statistiques globales de la plateforme.

#### GET /api/admin/departments/stats
Statistiques par département (admin seulement).

## 🎨 Frontend Components

### ActivityForm
Formulaire générique pour déclarer une activité.
```tsx
<ActivityForm 
  type="teaching" 
  onSubmit={handleSubmit}
  initialData={activity}
/>
```

### ValidationCard
Carte pour valider/rejeter une activité.
```tsx
<ValidationCard 
  activity={activity}
  onValidate={handleValidate}
  onReject={handleReject}
/>
```

### AnalyticsDashboard
Dashboard avec graphiques et statistiques.
```tsx
<AnalyticsDashboard 
  academicYear="2023-2024"
  userId={userId}
/>
```

### NotificationCenter
Centre de notifications en temps réel.
```tsx
<NotificationCenter 
  userId={userId}
  onNotificationClick={handleClick}
/>
```

## 🔐 Système de Permissions

### Rôles disponibles
- **enseignant** : Déclarer ses activités
- **chef_departement** : Valider activités du département
- **admin** : Accès complet département
- **super_admin** : Accès global système

### Hiérarchie de validation
```
Enseignant (draft)
    ↓ submit
Chef de département (pending)
    ↓ validate
Admin (validated) → Génération rapport
```

## 📊 Calcul des Primes

### Formule de calcul
```
Score = 
  + (Heures enseignement × 1 point)
  + (PFE encadrant × 10 points)
  + (Mémoire encadrant × 15 points)
  + (Thèse encadrant × 50 points)
  + (Article Scopus Q1 × 100 points)
  + (Article Scopus Q2 × 80 points)
  + (Conférence internationale × 30 points)
  + (Heures examens × 0.5 point)
  + (Responsabilités × 2 points/heure)

Prime = Base × (Score / 1000) × Multiplicateur
```

### Configuration dans `prime_rules`
```sql
INSERT INTO prime_rules (activity_category, points_per_unit, base_amount) VALUES
('teaching', 1, 50),
('supervision_pfe', 10, 200),
('research_scopus_q1', 100, 1000);
```

## 🧪 Tests

### Lancer les tests
```bash
# Tests unitaires
pnpm test

# Tests d'intégration
pnpm test:integration

# Coverage
pnpm test:coverage
```

## 🚀 Déploiement

### Option 1 : Vercel (Recommandé)
```bash
# Installer Vercel CLI
pnpm install -g vercel

# Déployer
vercel

# Configuration PostgreSQL
# Utiliser Vercel Postgres ou Supabase
```

### Option 2 : Docker
```bash
# Build l'image
docker build -t esprit-activities .

# Lancer avec docker-compose
docker-compose up -d
```

Créer `docker-compose.yml` :
```yaml
version: '3.8'
services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: esprit_activities
      POSTGRES_USER: esprit_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - ./scripts:/docker-entrypoint-initdb.d
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgresql://esprit_user:${DB_PASSWORD}@db:5432/esprit_activities
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - db

volumes:
  postgres_data:
```

### Option 3 : VPS Linux
```bash
# 1. Installer Node.js et PostgreSQL
sudo apt update
sudo apt install -y nodejs npm postgresql

# 2. Cloner le projet
git clone <repo-url>
cd esprit-activities

# 3. Installer pnpm
npm install -g pnpm

# 4. Configurer PostgreSQL
sudo -u postgres psql -f scripts/01-create-schema.sql
sudo -u postgres psql -f scripts/02-seed-data.sql
sudo -u postgres psql -f scripts/03-extended-schema.sql
sudo -u postgres psql -f scripts/04-extended-seed-data.sql

# 5. Build et lancer
pnpm install
pnpm build
pnpm start

# 6. Configurer Nginx comme reverse proxy
sudo nano /etc/nginx/sites-available/esprit-activities
```

Configuration Nginx :
```nginx
server {
    listen 80;
    server_name activities.esprit.tn;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Option 4 : PM2 (Process Manager)
```bash
# Installer PM2
pnpm install -g pm2

# Créer ecosystem.config.js
module.exports = {
  apps: [{
    name: 'esprit-activities',
    script: 'pnpm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}

# Lancer l'application
pm2 start ecosystem.config.js

# Configurer le démarrage automatique
pm2 startup
pm2 save
```

## 📝 Maintenance

### Sauvegarde de la base de données
```bash
# Sauvegarde complète
pg_dump -U esprit_user esprit_activities > backup_$(date +%Y%m%d).sql

# Restauration
psql -U esprit_user esprit_activities < backup_20240115.sql
```

### Mise à jour du schéma
```bash
# Créer une migration
psql -U esprit_user -d esprit_activities -f scripts/05-migration-xxx.sql
```

### Monitoring
```bash
# Logs PM2
pm2 logs esprit-activities

# Monitoring en temps réel
pm2 monit
```

## 🐛 Troubleshooting

### Erreur de connexion PostgreSQL
```bash
# Vérifier le service
sudo systemctl status postgresql

# Redémarrer PostgreSQL
sudo systemctl restart postgresql

# Vérifier les connexions
psql -U esprit_user -d esprit_activities -c "SELECT 1"
```

### Erreur JWT
Vérifier que `JWT_SECRET` est défini dans `.env.local` et fait au minimum 32 caractères.

### Erreur de permissions
```sql
-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO esprit_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO esprit_user;
```

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@esprit.tn
- 📖 Wiki : [Documentation complète](https://wiki.esprit.tn)
- 🐛 Issues : [GitHub Issues](https://github.com/esprit/activities/issues)

## 📄 Licence

© 2024 ESPRIT School of Business - Tous droits réservés.

## 👥 Contributeurs

- **Équipe DevOps ESPRIT**
- **Département IT**

---

**Version** : 1.0.0  
**Dernière mise à jour** : Janvier 2024
