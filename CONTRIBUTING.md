# 🤝 Guide de Contribution - ESPRIT Activities Platform

Merci de votre intérêt pour contribuer à la plateforme ESPRIT Activities ! Ce document vous guidera à travers le processus de contribution.

## 📋 Table des Matières

- [Code de Conduite](#code-de-conduite)
- [Comment Contribuer](#comment-contribuer)
- [Setup Environnement de Développement](#setup-environnement-de-développement)
- [Standards de Code](#standards-de-code)
- [Tests](#tests)
- [Processus de Pull Request](#processus-de-pull-request)
- [Conventions de Commit](#conventions-de-commit)
- [Structure du Projet](#structure-du-projet)

---

## 🤝 Code de Conduite

En participant à ce projet, vous vous engagez à respecter notre code de conduite :

- **Respect** : Soyez respectueux envers tous les contributeurs
- **Collaboration** : Travaillez ensemble de manière constructive
- **Professionnalisme** : Maintenez un environnement professionnel
- **Inclusivité** : Accueillez tous les contributeurs, peu importe leur niveau

---

## 🚀 Comment Contribuer

Il existe plusieurs façons de contribuer :

### 🐛 Signaler un Bug

1. Vérifiez que le bug n'a pas déjà été signalé dans les [Issues](https://github.com/esprit/activities/issues)
2. Créez une nouvelle issue avec le template "Bug Report"
3. Incluez :
   - Description claire du problème
   - Steps pour reproduire
   - Comportement attendu vs actuel
   - Captures d'écran si applicable
   - Version du système et navigateur

### ✨ Proposer une Nouvelle Fonctionnalité

1. Vérifiez la roadmap et les issues existantes
2. Créez une issue avec le template "Feature Request"
3. Décrivez :
   - Le problème que la fonctionnalité résoudrait
   - La solution proposée
   - Les alternatives considérées
   - Impact sur l'existant

### 📝 Améliorer la Documentation

- Corrections de typos
- Clarifications
- Ajout d'exemples
- Traductions

### 💻 Contribuer du Code

1. Choisissez ou créez une issue
2. Commentez sur l'issue pour signaler que vous travaillez dessus
3. Suivez le processus décrit ci-dessous

---

## 🛠️ Setup Environnement de Développement

### Prérequis

```bash
Node.js >= 18.x
PostgreSQL >= 14.x
pnpm >= 8.x
Git
```

### Installation

1. **Fork le repository**

```bash
# Sur GitHub, cliquez sur "Fork"
```

2. **Clone votre fork**

```bash
git clone https://github.com/VOTRE_USERNAME/esprit-activities.git
cd esprit-activities
```

3. **Ajouter le repo upstream**

```bash
git remote add upstream https://github.com/esprit/activities.git
```

4. **Installer les dépendances**

```bash
pnpm install
```

5. **Configurer la base de données**

```bash
# Créer la base de données
createdb esprit_activities

# Exécuter les migrations
psql esprit_activities < scripts/01-create-schema.sql
psql esprit_activities < scripts/02-seed-data.sql
psql esprit_activities < scripts/03-extended-schema.sql
psql esprit_activities < scripts/04-extended-seed-data.sql
```

6. **Configurer l'environnement**

```bash
# Copier .env.example vers .env.local
cp .env.example .env.local

# Éditer .env.local avec vos configurations
nano .env.local
```

7. **Lancer le serveur de développement**

```bash
pnpm dev
```

L'application sera accessible sur http://localhost:3000

---

## 📏 Standards de Code

### Style de Code

Nous utilisons **ESLint** et **Prettier** pour maintenir la cohérence du code.

#### Configuration

```bash
# Installer les extensions VSCode recommandées
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

#### Vérifier le code

```bash
# Lint
pnpm lint

# Format
pnpm format

# Fix automatiquement
pnpm lint:fix
```

### Conventions TypeScript

#### Nommage

```typescript
// Interfaces : PascalCase avec préfixe 'I' (optionnel)
interface UserData {
  id: number;
  name: string;
}

// Types : PascalCase
type ActivityStatus = 'draft' | 'pending' | 'validated' | 'rejected';

// Constantes : UPPER_SNAKE_CASE
const MAX_FILE_SIZE = 5242880;

// Fonctions : camelCase
function calculatePerformanceScore(userId: number): number {
  // ...
}

// Composants React : PascalCase
export default function ActivityForm() {
  // ...
}

// Fichiers : kebab-case pour utilitaires, PascalCase pour composants
// lib/bonus-calculator.ts
// components/ActivityForm.tsx
```

#### Types vs Interfaces

```typescript
// Préférer 'interface' pour les objets et classes
interface User {
  id: number;
  name: string;
}

// Préférer 'type' pour les unions et intersections
type Status = 'draft' | 'pending' | 'validated';
type MixedType = User & { status: Status };
```

### Conventions React

#### Composants Fonctionnels

```typescript
// Préférer les arrow functions avec types explicites
interface ActivityCardProps {
  activity: Activity;
  onEdit?: (id: number) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onEdit }) => {
  // Grouper les hooks au début
  const [isEditing, setIsEditing] = React.useState(false);
  const { user } = useAuth();
  
  // Puis les handlers
  const handleEdit = () => {
    setIsEditing(true);
    onEdit?.(activity.id);
  };
  
  // Rendu conditionnel
  if (!activity) return null;
  
  return (
    <div className="activity-card">
      {/* ... */}
    </div>
  );
};
```

#### Hooks Personnalisés

```typescript
// Préfixer avec 'use'
export function useActivities(academicYear: string) {
  const [activities, setActivities] = React.useState<Activity[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    fetchActivities(academicYear).then(setActivities);
  }, [academicYear]);
  
  return { activities, loading };
}
```

### Conventions SQL

```sql
-- Noms de tables : snake_case, pluriel
CREATE TABLE teaching_activities (...);

-- Noms de colonnes : snake_case
CREATE TABLE users (
  user_id INT,
  first_name VARCHAR(100),
  created_at TIMESTAMP
);

-- Indexes : idx_[table]_[column]
CREATE INDEX idx_users_email ON users(email);

-- Foreign keys : fk_[table]_[reference]
CONSTRAINT fk_activities_user FOREIGN KEY (user_id) REFERENCES users(id)
```

### Documentation

#### Commentaires JSDoc

```typescript
/**
 * Calculate the performance score for a user based on their activities
 * 
 * @param userId - The ID of the user
 * @param academicYear - The academic year (format: "YYYY-YYYY")
 * @returns Promise resolving to the calculated score
 * @throws {Error} If user is not found
 * 
 * @example
 * ```typescript
 * const score = await calculateScore(42, "2023-2024");
 * console.log(score); // 1847.5
 * ```
 */
export async function calculateScore(
  userId: number, 
  academicYear: string
): Promise<number> {
  // Implementation
}
```

#### Commentaires API

```typescript
/**
 * GET /api/teaching
 * 
 * Retrieve teaching activities for the authenticated user
 * 
 * Query Parameters:
 * - academic_year (optional): Filter by academic year
 * - semester (optional): Filter by semester (1 or 2)
 * - status (optional): Filter by status
 * 
 * Returns: Array of teaching activities with statistics
 * 
 * Authorization: JWT token required
 */
export async function GET(request: NextRequest) {
  // Implementation
}
```

---

## 🧪 Tests

### Structure des Tests

```
tests/
├── unit/           # Tests unitaires
├── integration/    # Tests d'intégration
├── e2e/            # Tests end-to-end
└── fixtures/       # Données de test
```

### Écrire des Tests

```typescript
// tests/unit/bonus-calculator.test.ts
import { calculateScore } from '@/lib/bonus-calculator';

describe('calculateScore', () => {
  it('should calculate correct score for teaching hours', () => {
    const result = calculateScore({
      teaching_hours: 100,
      supervisions: 0,
      publications: 0
    });
    
    expect(result).toBe(100);
  });
  
  it('should throw error for invalid data', () => {
    expect(() => {
      calculateScore({ teaching_hours: -10 });
    }).toThrow('Invalid hours');
  });
});
```

### Lancer les Tests

```bash
# Tous les tests
pnpm test

# Tests unitaires seulement
pnpm test:unit

# Tests avec coverage
pnpm test:coverage

# Watch mode
pnpm test:watch
```

### Coverage Minimum

- **Branches** : 80%
- **Functions** : 80%
- **Lines** : 85%
- **Statements** : 85%

---

## 🔄 Processus de Pull Request

### 1. Créer une Branche

```bash
# Synchroniser avec upstream
git fetch upstream
git checkout main
git merge upstream/main

# Créer une branche feature
git checkout -b feature/nom-de-la-fonctionnalite

# Ou branche bugfix
git checkout -b fix/description-du-bug
```

### 2. Développer

```bash
# Faire vos modifications
# ...

# Commiter régulièrement
git add .
git commit -m "feat: add new feature"

# Pousser votre branche
git push origin feature/nom-de-la-fonctionnalite
```

### 3. Créer la Pull Request

1. Allez sur GitHub sur votre fork
2. Cliquez sur "Compare & pull request"
3. Remplissez le template de PR :

```markdown
## Description
Brève description de la PR

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. Étape 1
2. Étape 2
3. Résultat attendu

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai ajouté des tests
- [ ] Tous les tests passent
- [ ] J'ai mis à jour la documentation
- [ ] Pas de warnings de lint
```

### 4. Review Process

- Un mainteneur reviewera votre PR
- Répondez aux commentaires et faites les modifications demandées
- Une fois approuvée, elle sera merged

### 5. Après le Merge

```bash
# Synchroniser votre main
git checkout main
git pull upstream main
git push origin main

# Supprimer la branche locale
git branch -d feature/nom-de-la-fonctionnalite

# Supprimer la branche distante
git push origin --delete feature/nom-de-la-fonctionnalite
```

---

## 📝 Conventions de Commit

Nous suivons la convention [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: Nouvelle fonctionnalité
- **fix**: Correction de bug
- **docs**: Documentation seulement
- **style**: Changements de style (formatage, etc.)
- **refactor**: Refactoring de code
- **perf**: Amélioration de performance
- **test**: Ajout ou modification de tests
- **chore**: Maintenance (dépendances, config, etc.)
- **ci**: Changements CI/CD
- **build**: Changements au système de build

### Exemples

```bash
# Feature
git commit -m "feat(api): add endpoint for research publications"

# Bug fix
git commit -m "fix(auth): resolve JWT expiration issue"

# Documentation
git commit -m "docs(readme): update installation instructions"

# Refactoring
git commit -m "refactor(calculations): extract score calculation logic"

# Breaking change
git commit -m "feat(api)!: change response format for teaching activities

BREAKING CHANGE: Response now returns array instead of object"
```

### Scope

- **api**: Endpoints API
- **auth**: Authentification
- **db**: Base de données
- **ui**: Interface utilisateur
- **docs**: Documentation
- **tests**: Tests
- **config**: Configuration

---

## 📁 Structure du Projet

```
esprit-activities/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── teaching/      # Routes enseignement
│   │   ├── supervision/   # Routes encadrement
│   │   └── ...
│   ├── dashboard/         # Pages du dashboard
│   └── ...
├── components/            # Composants React
│   ├── ui/               # Composants UI de base
│   └── ...
├── lib/                  # Bibliothèques et utilitaires
│   ├── auth.ts           # Logique authentification
│   ├── db.ts             # Connexion DB
│   └── ...
├── hooks/                # Hooks React personnalisés
├── scripts/              # Scripts SQL
├── tests/                # Tests
├── public/               # Assets statiques
└── docs/                 # Documentation additionnelle
```

---

## 🎯 Bonnes Pratiques

### Code Propre

- **DRY** : Don't Repeat Yourself
- **KISS** : Keep It Simple, Stupid
- **YAGNI** : You Aren't Gonna Need It
- **SOLID** : Principes de conception objet

### Sécurité

- Ne jamais commiter de secrets (API keys, passwords)
- Valider toutes les entrées utilisateur
- Utiliser des requêtes paramétrées (pas de concaténation SQL)
- Gérer les erreurs proprement

### Performance

- Utiliser la pagination pour les grandes listes
- Optimiser les requêtes SQL (indexes, joins)
- Lazy loading des composants lourds
- Caching approprié

### Accessibilité

- Utiliser les balises sémantiques HTML
- Ajouter des attributs ARIA quand nécessaire
- Support clavier complet
- Contraste de couleurs suffisant

---

## 📞 Besoin d'Aide ?

- 💬 **Discussions** : [GitHub Discussions](https://github.com/esprit/activities/discussions)
- 📧 **Email** : dev@esprit.tn
- 📖 **Documentation** : [Wiki](https://github.com/esprit/activities/wiki)
- 🐛 **Issues** : [GitHub Issues](https://github.com/esprit/activities/issues)

---

## 🙏 Remerciements

Merci à tous les contributeurs qui ont participé à ce projet !

[Liste des contributeurs](https://github.com/esprit/activities/graphs/contributors)

---

**Bonne contribution ! 🚀**
