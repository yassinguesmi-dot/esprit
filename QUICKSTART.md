# 🚀 Guide de Démarrage Rapide - ESPRIT Activities

Guide pour démarrer rapidement avec la plateforme en 10 minutes.

## ⚡ Installation Express (10 minutes)

### Option 1 : Docker (Recommandé) 🐳

La façon la plus rapide de démarrer !

```bash
# 1. Cloner le projet
git clone <repo-url>
cd esprit-activities

# 2. Créer le fichier .env
cp .env.example .env.local

# 3. Éditer .env.local (juste les essentiels)
nano .env.local
```

Modifier uniquement :
```env
DATABASE_URL=postgresql://esprit_user:password123@db:5432/esprit_activities
JWT_SECRET=votre_secret_jwt_minimum_32_caracteres_aleatoires
```

```bash
# 4. Lancer avec Docker Compose
docker-compose up -d

# 5. Vérifier que tout fonctionne
curl http://localhost:3000/health
```

✅ **Terminé !** Accédez à http://localhost:3000

---

### Option 2 : Installation Manuelle 💻

Si vous préférez installer localement (15 minutes).

#### Étape 1 : Prérequis

```bash
# Vérifier Node.js (>= 18.x)
node --version

# Vérifier PostgreSQL (>= 14.x)
psql --version

# Installer pnpm si nécessaire
npm install -g pnpm
```

#### Étape 2 : Base de Données

```bash
# Créer la base
createdb esprit_activities

# Créer l'utilisateur
psql -c "CREATE USER esprit_user WITH ENCRYPTED PASSWORD 'password123';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE esprit_activities TO esprit_user;"

# Exécuter les migrations (dans l'ordre !)
cd scripts
psql -U esprit_user -d esprit_activities -f 01-create-schema.sql
psql -U esprit_user -d esprit_activities -f 02-seed-data.sql
psql -U esprit_user -d esprit_activities -f 03-extended-schema.sql
psql -U esprit_user -d esprit_activities -f 04-extended-seed-data.sql
cd ..
```

#### Étape 3 : Application

```bash
# Installer les dépendances
pnpm install

# Copier la config
cp .env.example .env.local

# Éditer .env.local
nano .env.local
```

Configurer au minimum :
```env
DATABASE_URL=postgresql://esprit_user:password123@localhost:5432/esprit_activities
JWT_SECRET=generer_avec_openssl_rand_base64_48
```

```bash
# Lancer en mode développement
pnpm dev
```

✅ **Prêt !** Ouvrez http://localhost:3000

---

## 👤 Comptes de Test

Utilisez ces comptes pour tester la plateforme :

### Enseignant
```
Email: nessrine.tlili@esprit.tn
Password: password123
Rôle: Enseignant
```

Exemples déjà présents dans le compte :
- Activité validée : Cours de Développement Web
- Activité validée : Publication scientifique IA
- Activité en attente : Conférence DevOps Campus
- Rapport prêt : Rapport 2024-2025

### Chef de Département
```
Email: chef@esprit.tn
Password: password123
Rôle: Chef de Département
```

Exemples déjà présents dans le compte :
- Activité validée : Pilotage du comité pédagogique
- Activité en attente : Présidence de jury PFE
- Rapport prêt : Rapport 2024-2025

### Administrateur
```
Email: admin@esprit.tn
Password: password123
Rôle: Admin
```

Exemples déjà présents dans le compte :
- Activité validée : Organisation de la journée innovation
- Activité validée : Encadrement transversal des stages
- Rapport prêt : Rapport 2024-2025

---

## 🧪 Tester l'API

### 1. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "nessrine.tlili@esprit.tn",
    "password": "password123"
  }'
```

Copier le `token` de la réponse.

### 2. Créer une Activité d'Enseignement

```bash
curl -X POST http://localhost:3000/api/teaching \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{
    "formation_id": 1,
    "class_id": 1,
    "module_id": 1,
    "activity_type": "CM",
    "planned_hours": 42,
    "completed_hours": 40,
    "academic_year": "2023-2024",
    "semester": 1
  }'
```

### 3. Récupérer les Activités

```bash
curl -X GET "http://localhost:3000/api/teaching?academic_year=2023-2024" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI"
```

### 4. Générer un Rapport PDF

```bash
curl -X POST http://localhost:3000/api/reports/generate \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -H "Content-Type: application/json" \
  -d '{"academic_year": "2023-2024"}' \
  --output rapport.pdf
```

---

## 📱 Interface Web

### Parcours Enseignant

1. **Connexion** : http://localhost:3000/login
2. **Dashboard** : http://localhost:3000/dashboard
3. **Déclarer Activité** : http://localhost:3000/activities
4. **Voir Rapports** : http://localhost:3000/reports

### Parcours Chef de Département

1. **Connexion** avec compte chef
2. **Valider Activités** : http://localhost:3000/validation
3. **Statistiques** : http://localhost:3000/admin

---

## 🔧 Configuration Avancée

### Variables d'Environnement Importantes

```env
# Base de données
DATABASE_URL=postgresql://user:pass@host:5432/dbname

# JWT
JWT_SECRET=secret_minimum_32_caracteres
JWT_EXPIRES_IN=7d

# Email (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@esprit.tn
SMTP_PASSWORD=mot_de_passe_app

# Fonctionnalités
ENABLE_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=false
```

### Générer un JWT Secret Sécurisé

```bash
# Sur Linux/Mac
openssl rand -base64 48

# Sur Windows (PowerShell)
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## 🐛 Résolution de Problèmes

### L'application ne démarre pas

```bash
# Vérifier Node.js
node --version  # Doit être >= 18.x

# Réinstaller les dépendances
rm -rf node_modules .next
pnpm install
```

### Erreur de connexion à la base de données

```bash
# Vérifier que PostgreSQL tourne
pg_isready

# Tester la connexion
psql -U esprit_user -d esprit_activities -c "SELECT 1"

# Vérifier DATABASE_URL dans .env.local
cat .env.local | grep DATABASE_URL
```

### Erreur "JWT malformed"

```bash
# Vérifier JWT_SECRET
cat .env.local | grep JWT_SECRET

# Doit faire au moins 32 caractères
# Régénérer si nécessaire
openssl rand -base64 48
```

### Port 3000 déjà utilisé

```bash
# Changer le port dans .env.local
PORT=3001

# Ou tuer le processus sur le port 3000
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 Prochaines Étapes

### Développement

1. **Lire la documentation** :
   - [README.md](../README.md) - Vue d'ensemble complète
   - [API.md](../API.md) - Documentation API détaillée
   - [CONTRIBUTING.md](../CONTRIBUTING.md) - Guide de contribution

2. **Personnaliser** :
   - Modifier les composants dans `components/`
   - Ajouter des pages dans `app/`
   - Créer de nouvelles API routes dans `app/api/`

3. **Tester** :
   ```bash
   pnpm test
   pnpm test:coverage
   ```

### Production

1. **Déploiement** :
   - Lire [DEPLOYMENT.md](../DEPLOYMENT.md)
   - Choisir votre plateforme (Vercel, VPS, Docker)
   - Configurer SSL/HTTPS
   - Mettre en place les backups

2. **Monitoring** :
   - Configurer les logs
   - Mettre en place des alertes
   - Surveiller les performances

3. **Sécurité** :
   - Changer tous les mots de passe par défaut
   - Configurer le firewall
   - Activer Fail2Ban
   - Réviser les permissions

---

## 🎯 Checklist de Démarrage

- [ ] PostgreSQL installé et démarré
- [ ] Base de données créée (`esprit_activities`)
- [ ] Scripts SQL exécutés (01 → 04)
- [ ] Node.js >= 18.x installé
- [ ] pnpm installé
- [ ] Dépendances installées (`pnpm install`)
- [ ] `.env.local` configuré
- [ ] `JWT_SECRET` généré (32+ caractères)
- [ ] `DATABASE_URL` correcte
- [ ] Application démarre (`pnpm dev`)
- [ ] Login fonctionne (compte test)
- [ ] API répond (`curl http://localhost:3000/health`)

---

## 💡 Astuces

### Développement Plus Rapide

```bash
# Watch mode pour les changements
pnpm dev

# Ouvrir plusieurs terminaux :
# Terminal 1 : Application
pnpm dev

# Terminal 2 : Tests en watch
pnpm test:watch

# Terminal 3 : Logs PostgreSQL
tail -f /var/log/postgresql/postgresql-14-main.log
```

### Données de Test

```bash
# Réinitialiser avec nouvelles données
psql -U esprit_user -d esprit_activities -f scripts/02-seed-data.sql
psql -U esprit_user -d esprit_activities -f scripts/04-extended-seed-data.sql
```

### Debugging

```bash
# Activer le mode debug dans .env.local
DEBUG=true
LOG_LEVEL=debug
LOG_SQL_QUERIES=true

# Voir les requêtes SQL dans la console
```

---

## 📞 Besoin d'Aide ?

- 📖 **Documentation** : Voir les autres fichiers `.md` dans le projet
- 🐛 **Bug** : Ouvrir une issue sur GitHub
- 💬 **Question** : Discussions GitHub ou email à dev@esprit.tn
- 🚀 **Contribution** : Lire [CONTRIBUTING.md](../CONTRIBUTING.md)

---

## 🎉 Félicitations !

Vous êtes maintenant prêt à utiliser la plateforme ESPRIT Activities !

**Prochaines actions suggérées :**
1. Explorer l'interface utilisateur
2. Tester les différents rôles
3. Créer quelques activités de test
4. Générer un rapport PDF
5. Explorer le code source

**Bon développement ! 💻✨**
