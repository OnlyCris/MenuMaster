# MenuIsland - Guida Deploy Completa

## Opzioni di Deploy

### 🚀 Deploy Automatico - Debian 12

**Comando unico per installazione completa:**

```bash
wget https://raw.githubusercontent.com/your-org/menuisland/main/debian-installer.sh
chmod +x debian-installer.sh
sudo ./debian-installer.sh
```

Questo script installa e configura automaticamente:
- Node.js 18
- PostgreSQL 14
- Nginx con SSL
- PM2 process manager
- Firewall e sicurezza
- Backup automatici
- Certificati SSL Let's Encrypt

### 📋 Prerequisiti

**Server Requirements:**
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- Minimo 2GB RAM (4GB consigliati)
- 20GB spazio disco (50GB consigliati)
- Accesso root/sudo
- Dominio configurato con DNS

**Servizi Esterni (Opzionali):**
- Account Stripe (pagamenti)
- Account SendGrid (email)
- Account Cloudflare (sottodomini)
- Google Cloud (traduzioni)

## Deploy Manuale

### 1. Preparazione Server

```bash
# Aggiorna sistema
sudo apt update && sudo apt upgrade -y

# Installa dipendenze base
sudo apt install -y curl wget git unzip nginx postgresql postgresql-contrib
```

### 2. Installazione Node.js

```bash
# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verifica installazione
node --version
npm --version
```

### 3. Setup Database

```bash
# Avvia PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crea database
sudo -u postgres psql
CREATE DATABASE menuisland_production;
CREATE USER menuisland WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE menuisland_production TO menuisland;
\q
```

### 4. Clone e Build Applicazione

```bash
# Crea directory
sudo mkdir -p /var/www/menuisland
sudo chown $USER:$USER /var/www/menuisland
cd /var/www/menuisland

# Clone repository (o upload files)
git clone https://github.com/your-org/menuisland.git .

# Installa dipendenze
npm install

# Configura environment
cp .env.example .env
nano .env
```

### 5. Configurazione .env

```env
# Database
DATABASE_URL="postgresql://menuisland:your_password@localhost:5432/menuisland_production"

# Server
NODE_ENV=production
PORT=5000
SESSION_SECRET="your-super-secret-key-min-32-chars"

# Domain
DOMAIN=yourdomain.com
BASE_URL=https://yourdomain.com

# Stripe (Opzionale)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...

# Email (Opzionale)
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@yourdomain.com

# Cloudflare (Opzionale)
CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ZONE_ID=...

# Google Translate (Opzionale)
GOOGLE_TRANSLATE_API_KEY=...
```

### 6. Build e Deploy Database

```bash
# Build applicazione
VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build

# Deploy database schema
npm run db:push
```

### 7. Configurazione Nginx

```bash
sudo nano /etc/nginx/sites-available/menuisland
```

```nginx
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com *.yourdomain.com;
    
    # SSL certificates (configurati con certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Proxy to Node.js
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files
    location /uploads {
        alias /var/www/menuisland/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Abilita sito
sudo ln -s /etc/nginx/sites-available/menuisland /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 8. SSL con Let's Encrypt

```bash
# Installa certbot
sudo apt install certbot python3-certbot-nginx

# Genera certificati
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com

# Auto-renewal
sudo crontab -e
# Aggiungi: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 9. PM2 Setup

```bash
# Installa PM2
sudo npm install -g pm2

# Avvia applicazione
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 10. Sicurezza e Backup

```bash
# Firewall
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

# Fail2Ban
sudo apt install fail2ban

# Script backup
sudo mkdir -p /var/backups/menuisland /var/scripts
```

## Verifica Installazione

### Test Componenti

```bash
# Database
psql -h localhost -U menuisland -d menuisland_production -c "SELECT NOW();"

# Applicazione
curl http://localhost:5000/api/health

# Nginx
sudo nginx -t

# SSL
curl -I https://yourdomain.com

# PM2
pm2 status
pm2 logs menuisland
```

### Monitoring

```bash
# Status servizi
sudo systemctl status nginx postgresql

# Logs applicazione
pm2 logs menuisland --lines 50

# Performance
pm2 monit

# Spazio disco
df -h

# Memoria
free -h
```

## Aggiornamenti

### Update Automatico

```bash
# Esegui script update
/var/scripts/update-menuisland.sh
```

### Update Manuale

```bash
cd /var/www/menuisland

# Backup
/var/scripts/backup-menuisland.sh

# Stop app
pm2 stop menuisland

# Update code
git pull origin main
npm install
VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build

# Database migrations
npm run db:push

# Restart
pm2 restart menuisland
```

## Troubleshooting

### Problemi Comuni

**Database Connection Error:**
```bash
# Verifica servizio
sudo systemctl status postgresql
sudo systemctl restart postgresql

# Test connessione
psql -h localhost -U menuisland -d menuisland_production
```

**Nginx 502 Bad Gateway:**
```bash
# Verifica app
pm2 status
pm2 restart menuisland

# Check logs
pm2 logs menuisland
sudo tail -f /var/log/nginx/error.log
```

**SSL Certificate Issues:**
```bash
# Rinnova certificati
sudo certbot renew
sudo systemctl reload nginx

# Verifica certificati
sudo certbot certificates
```

**High Memory Usage:**
```bash
# Restart PM2
pm2 restart menuisland

# Check memory limits
pm2 show menuisland
```

### Log Analysis

```bash
# Application logs
pm2 logs menuisland

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# System logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

## Performance Optimization

### Database Tuning

```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
```

### Nginx Optimization

```nginx
# nginx.conf
worker_processes auto;
worker_connections 1024;
sendfile on;
gzip on;
gzip_types text/plain application/json application/javascript text/css;
```

### PM2 Tuning

```javascript
// ecosystem.config.js
{
  instances: 'max',
  max_memory_restart: '512M',
  node_args: '--max-old-space-size=512'
}
```

## Deploy su Cloud

### AWS EC2

1. Lancia istanza Ubuntu 20.04 (t3.medium consigliata)
2. Configura Security Group (22, 80, 443)
3. Associa Elastic IP
4. Esegui script installazione
5. Configura Route 53 per DNS

### DigitalOcean Droplet

1. Crea Droplet Ubuntu 20.04 (2GB RAM)
2. Aggiungi dominio al DNS
3. Esegui script installazione
4. Configura backup automatici

### Google Cloud VM

1. Crea VM Instance Ubuntu 20.04
2. Configura firewall rules
3. Assegna IP statico
4. Esegui script installazione

## Monitoraggio Produzione

### Uptime Monitoring

- UptimeRobot
- Pingdom
- StatusCake

### Error Tracking

- Sentry
- Bugsnag
- LogRocket

### Performance Monitoring

- New Relic
- DataDog
- PM2 Plus

---

**MenuIsland è ora pronto per la produzione con un setup robusto, sicuro e scalabile.**