# 🚀 Guide de Déploiement - Plateforme ESPRIT Activities

Guide complet pour le déploiement en production de la plateforme de suivi des activités académiques.

## 📋 Table des Matières

1. [Prérequis](#prérequis)
2. [Configuration de l'environnement](#configuration-de-lenvironnement)
3. [Déploiement sur Vercel](#déploiement-sur-vercel)
4. [Déploiement sur VPS](#déploiement-sur-vps)
5. [Configuration SSL](#configuration-ssl)
6. [Monitoring et Logs](#monitoring-et-logs)
7. [Backup et Restauration](#backup-et-restauration)
8. [Sécurité](#sécurité)

---

## 🔧 Prérequis

### Requis Système
- **Node.js** : v18.x ou supérieur
- **PostgreSQL** : v14.x ou supérieur
- **Mémoire RAM** : Minimum 2GB (4GB recommandé)
- **Espace disque** : Minimum 10GB
- **CPU** : 2 cores minimum

### Comptes Requis
- Compte GitHub (pour le code source)
- Compte Vercel (option cloud) OU Serveur VPS
- Compte Email SMTP (pour notifications)

---

## ⚙️ Configuration de l'Environnement

### 1. Variables d'environnement de production

Créer `.env.production` :

```env
# ======================
# DATABASE CONFIGURATION
# ======================
DATABASE_URL=postgresql://esprit_user:STRONG_PASSWORD_HERE@db-host:5432/esprit_activities

# Pour Vercel Postgres
# DATABASE_URL sera fourni automatiquement

# Pour Supabase
# DATABASE_URL=postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres

# ======================
# JWT & SECURITY
# ======================
JWT_SECRET=your_super_secure_random_string_minimum_32_characters_here_use_openssl_rand
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# ======================
# APPLICATION
# ======================
NODE_ENV=production
NEXT_PUBLIC_APP_NAME=ESPRIT Activities Platform
NEXT_PUBLIC_APP_URL=https://activities.esprit.tn
PORT=3000

# ======================
# EMAIL CONFIGURATION
# ======================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@esprit.tn
SMTP_PASSWORD=your_app_specific_password
SMTP_FROM="ESPRIT Activities <noreply@esprit.tn>"

# ======================
# FILE STORAGE
# ======================
# Option 1 : Local storage
UPLOAD_DIR=/var/www/uploads

# Option 2 : AWS S3
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=eu-west-1
AWS_S3_BUCKET=esprit-activities-files

# ======================
# LOGGING & MONITORING
# ======================
LOG_LEVEL=info
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx

# ======================
# RATE LIMITING
# ======================
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# ======================
# CORS
# ======================
ALLOWED_ORIGINS=https://activities.esprit.tn,https://www.esprit.tn
```

### 2. Générer les secrets

```bash
# Générer JWT_SECRET
openssl rand -base64 48

# Générer un password PostgreSQL fort
openssl rand -base64 32
```

---

## ☁️ Déploiement sur Vercel

### Option recommandée pour déploiement rapide

### Étape 1 : Préparation

```bash
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Lier le projet
vercel link
```

### Étape 2 : Configurer la base de données

#### Option A : Vercel Postgres (Recommandé)

```bash
# Créer une base Vercel Postgres
vercel postgres create esprit-activities-db

# Lier au projet
vercel postgres link

# Les variables DATABASE_URL seront automatiquement ajoutées
```

#### Option B : Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Noter l'URL de connexion PostgreSQL
3. Exécuter les scripts SQL via l'interface Supabase :
   - `01-create-schema.sql`
   - `02-seed-data.sql`
   - `03-extended-schema.sql`
   - `04-extended-seed-data.sql`

### Étape 3 : Configurer les variables d'environnement

```bash
# Via CLI
vercel env add JWT_SECRET production
vercel env add SMTP_HOST production
vercel env add SMTP_USER production
vercel env add SMTP_PASSWORD production

# OU via Dashboard Vercel
# Settings → Environment Variables
```

### Étape 4 : Déployer

```bash
# Déploiement production
vercel --prod

# L'URL sera fournie : https://esprit-activities.vercel.app
```

### Étape 5 : Configurer le domaine personnalisé

```bash
# Ajouter votre domaine
vercel domains add activities.esprit.tn

# Configurer les DNS chez votre registrar
# A record : 76.76.21.21
# CNAME : cname.vercel-dns.com
```

### Étape 6 : Initialiser la base de données

```bash
# Se connecter à la base
vercel postgres connect esprit-activities-db

# Ou exécuter via script
psql $DATABASE_URL -f scripts/01-create-schema.sql
psql $DATABASE_URL -f scripts/02-seed-data.sql
psql $DATABASE_URL -f scripts/03-extended-schema.sql
psql $DATABASE_URL -f scripts/04-extended-seed-data.sql
```

---

## 🖥️ Déploiement sur VPS

### Configuration serveur Ubuntu 22.04

### Étape 1 : Préparation du serveur

```bash
# Connexion SSH
ssh root@your-server-ip

# Mise à jour système
apt update && apt upgrade -y

# Installer les outils essentiels
apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Créer un utilisateur dédié
adduser esprit
usermod -aG sudo esprit
su - esprit
```

### Étape 2 : Installer Node.js

```bash
# Installer Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Vérifier
node --version  # v20.x.x
npm --version   # 10.x.x

# Installer pnpm
sudo npm install -g pnpm
```

### Étape 3 : Installer PostgreSQL

```bash
# Installer PostgreSQL 14
sudo apt install -y postgresql postgresql-contrib

# Démarrer le service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer la base et l'utilisateur
sudo -u postgres psql <<EOF
CREATE DATABASE esprit_activities;
CREATE USER esprit_user WITH ENCRYPTED PASSWORD 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE esprit_activities TO esprit_user;
\c esprit_activities
GRANT ALL ON SCHEMA public TO esprit_user;
EOF

# Configurer l'accès
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ajouter : host esprit_activities esprit_user 127.0.0.1/32 md5

sudo systemctl restart postgresql
```

### Étape 4 : Déployer l'application

```bash
# Cloner le repository
cd /home/esprit
git clone https://github.com/your-org/esprit-activities.git
cd esprit-activities

# Installer les dépendances
pnpm install

# Créer .env.production
nano .env.production
# Coller la configuration de production

# Initialiser la base de données
psql postgresql://esprit_user:PASSWORD@localhost:5432/esprit_activities -f scripts/01-create-schema.sql
psql postgresql://esprit_user:PASSWORD@localhost:5432/esprit_activities -f scripts/02-seed-data.sql
psql postgresql://esprit_user:PASSWORD@localhost:5432/esprit_activities -f scripts/03-extended-schema.sql
psql postgresql://esprit_user:PASSWORD@localhost:5432/esprit_activities -f scripts/04-extended-seed-data.sql

# Build l'application
pnpm build
```

### Étape 5 : Installer PM2

```bash
# Installer PM2
sudo npm install -g pm2

# Créer le fichier de configuration
nano ecosystem.config.js
```

Contenu de `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'esprit-activities',
    script: 'node_modules/next/dist/bin/next',
    args: 'start',
    cwd: '/home/esprit/esprit-activities',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/esprit/logs/err.log',
    out_file: '/home/esprit/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
}
```

```bash
# Créer le dossier logs
mkdir -p /home/esprit/logs

# Lancer l'application
pm2 start ecosystem.config.js

# Configurer le démarrage automatique
pm2 startup systemd -u esprit --hp /home/esprit
pm2 save

# Vérifier le statut
pm2 status
pm2 logs esprit-activities
```

### Étape 6 : Configurer Nginx

```bash
# Créer la configuration
sudo nano /etc/nginx/sites-available/esprit-activities
```

Contenu de la configuration Nginx :

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;

# Upstream
upstream nextjs_upstream {
  server 127.0.0.1:3000;
  keepalive 64;
}

# HTTP → HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name activities.esprit.tn www.activities.esprit.tn;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name activities.esprit.tn www.activities.esprit.tn;

    # SSL Configuration (will be managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/activities.esprit.tn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/activities.esprit.tn/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Logging
    access_log /var/log/nginx/esprit-activities.access.log;
    error_log /var/log/nginx/esprit-activities.error.log;

    # Max upload size
    client_max_body_size 50M;

    # Proxy settings
    location / {
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_cache_bypass $http_upgrade;
        
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
    }

    # Rate limiting for API
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Stricter rate limiting for login
    location /api/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://nextjs_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://nextjs_upstream;
        proxy_cache_valid 200 365d;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Activer la configuration
sudo ln -s /etc/nginx/sites-available/esprit-activities /etc/nginx/sites-enabled/

# Tester la configuration
sudo nginx -t

# Recharger Nginx
sudo systemctl reload nginx
```

---

## 🔒 Configuration SSL

### Avec Let's Encrypt (Gratuit)

```bash
# Obtenir le certificat SSL
sudo certbot --nginx -d activities.esprit.tn -d www.activities.esprit.tn

# Tester le renouvellement automatique
sudo certbot renew --dry-run

# Le renouvellement automatique est configuré via systemd
sudo systemctl status certbot.timer
```

### Renouvellement manuel si nécessaire

```bash
sudo certbot renew
sudo systemctl reload nginx
```

---

## 📊 Monitoring et Logs

### 1. PM2 Monitoring

```bash
# Surveiller en temps réel
pm2 monit

# Consulter les logs
pm2 logs esprit-activities --lines 100

# Statistiques
pm2 show esprit-activities
```

### 2. Nginx Logs

```bash
# Logs d'accès
sudo tail -f /var/log/nginx/esprit-activities.access.log

# Logs d'erreur
sudo tail -f /var/log/nginx/esprit-activities.error.log

# Analyser les logs avec goaccess
sudo apt install goaccess
sudo goaccess /var/log/nginx/esprit-activities.access.log --log-format=COMBINED
```

### 3. PostgreSQL Monitoring

```bash
# Connexions actives
sudo -u postgres psql esprit_activities -c "SELECT count(*) FROM pg_stat_activity;"

# Taille de la base
sudo -u postgres psql esprit_activities -c "SELECT pg_size_pretty(pg_database_size('esprit_activities'));"

# Requêtes lentes
sudo -u postgres psql esprit_activities -c "SELECT query, calls, total_time/1000 as total_seconds FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"
```

### 4. Alertes automatiques

Créer `/home/esprit/scripts/health-check.sh` :

```bash
#!/bin/bash
URL="https://activities.esprit.tn/health"
EMAIL="admin@esprit.tn"

if ! curl -f -s "$URL" > /dev/null; then
    echo "ALERT: Site is down!" | mail -s "ESPRIT Activities DOWN" "$EMAIL"
    pm2 restart esprit-activities
fi
```

```bash
# Rendre exécutable
chmod +x /home/esprit/scripts/health-check.sh

# Ajouter au crontab (vérifier toutes les 5 minutes)
crontab -e
# Ajouter : */5 * * * * /home/esprit/scripts/health-check.sh
```

---

## 💾 Backup et Restauration

### 1. Backup automatique de la base de données

Créer `/home/esprit/scripts/backup-db.sh` :

```bash
#!/bin/bash
BACKUP_DIR="/home/esprit/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="esprit_activities"
DB_USER="esprit_user"
DB_PASSWORD="YOUR_PASSWORD"

# Créer le dossier si nécessaire
mkdir -p $BACKUP_DIR

# Backup avec compression
PGPASSWORD=$DB_PASSWORD pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/backup_${DATE}.sql.gz

# Garder seulement les 30 derniers backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: backup_${DATE}.sql.gz"
```

```bash
# Rendre exécutable
chmod +x /home/esprit/scripts/backup-db.sh

# Configurer cron (backup quotidien à 2h du matin)
crontab -e
# Ajouter : 0 2 * * * /home/esprit/scripts/backup-db.sh
```

### 2. Restauration

```bash
# Restaurer depuis un backup
gunzip -c /home/esprit/backups/backup_20240115_020000.sql.gz | psql -U esprit_user -h localhost esprit_activities
```

### 3. Backup des fichiers uploadés

```bash
# Backup du dossier uploads (si stockage local)
tar -czf /home/esprit/backups/uploads_$(date +%Y%m%d).tar.gz /var/www/uploads/

# Synchroniser vers un serveur distant
rsync -avz /var/www/uploads/ backup-server:/backups/esprit-uploads/
```

---

## 🛡️ Sécurité

### 1. Firewall (UFW)

```bash
# Activer UFW
sudo ufw enable

# Autoriser SSH
sudo ufw allow 22/tcp

# Autoriser HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Vérifier le statut
sudo ufw status
```

### 2. Fail2Ban (Protection contre brute force)

```bash
# Installer Fail2Ban
sudo apt install fail2ban

# Créer une configuration personnalisée
sudo nano /etc/fail2ban/jail.local
```

Contenu de `jail.local` :

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
destemail = admin@esprit.tn
sendername = Fail2Ban

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/esprit-activities.error.log
```

```bash
# Redémarrer Fail2Ban
sudo systemctl restart fail2ban

# Vérifier le statut
sudo fail2ban-client status
```

### 3. Sécuriser PostgreSQL

```bash
# Éditer la configuration
sudo nano /etc/postgresql/14/main/postgresql.conf

# Modifier :
# listen_addresses = 'localhost'
# max_connections = 100
# shared_buffers = 256MB

# Éditer pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# N'autoriser que localhost
# local   all             all                                     peer
# host    all             all             127.0.0.1/32            md5
# host    all             all             ::1/128                 md5

# Redémarrer
sudo systemctl restart postgresql
```

### 4. Mettre à jour régulièrement

```bash
# Créer un script de mise à jour
nano /home/esprit/scripts/update-system.sh
```

Contenu :

```bash
#!/bin/bash
sudo apt update
sudo apt upgrade -y
sudo apt autoremove -y
pm2 update
npm update -g
```

```bash
chmod +x /home/esprit/scripts/update-system.sh

# Exécuter chaque semaine
crontab -e
# Ajouter : 0 3 * * 0 /home/esprit/scripts/update-system.sh
```

---

## 📈 Optimisations Performance

### 1. PostgreSQL Tuning

```sql
-- Créer des index pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY idx_teaching_user_year 
ON teaching_activities(user_id, academic_year);

CREATE INDEX CONCURRENTLY idx_supervision_user_year 
ON supervision_activities(user_id, academic_year);

CREATE INDEX CONCURRENTLY idx_research_user_year 
ON research_publications(user_id, EXTRACT(YEAR FROM publication_date));

-- Activer les statistiques étendues
ALTER TABLE teaching_activities SET (autovacuum_vacuum_scale_factor = 0.1);
```

### 2. Next.js Optimizations

Dans `next.config.mjs` :

```javascript
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    domains: ['activities.esprit.tn'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### 3. Redis pour le caching (optionnel)

```bash
# Installer Redis
sudo apt install redis-server

# Configurer
sudo nano /etc/redis/redis.conf
# maxmemory 256mb
# maxmemory-policy allkeys-lru

sudo systemctl restart redis
```

---

## 🚨 Checklist Finale de Déploiement

- [ ] Variables d'environnement configurées
- [ ] Base de données migrée et seedée
- [ ] SSL/TLS configuré avec certificat valide
- [ ] Firewall activé et configuré
- [ ] Fail2Ban installé et actif
- [ ] Backups automatiques configurés
- [ ] PM2 configuré avec redémarrage automatique
- [ ] Nginx configuré avec rate limiting
- [ ] Logs rotatifs configurés
- [ ] Monitoring en place
- [ ] Tests de charge effectués
- [ ] Documentation à jour
- [ ] Équipe formée
- [ ] Plan de rollback préparé

---

## 📞 Support Urgence

En cas de problème critique :

1. **Vérifier les logs** : `pm2 logs` et `/var/log/nginx/`
2. **Redémarrer l'application** : `pm2 restart esprit-activities`
3. **Vérifier la base** : `psql -U esprit_user esprit_activities -c "SELECT 1"`
4. **Rollback** : `git checkout <previous-version> && pnpm install && pnpm build && pm2 restart`
5. **Contacter l'équipe** : admin@esprit.tn

---

**Bonne chance avec votre déploiement! 🚀**
