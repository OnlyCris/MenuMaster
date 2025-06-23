# MenuIsland - Guida Installazione Server Privato

## Requisiti Sistema

### Hardware Minimo
- **CPU**: 2 core (4 core consigliati)
- **RAM**: 4GB (8GB consigliati)
- **Storage**: 20GB SSD (50GB consigliati)
- **Banda**: 100Mbps upload/download

### Software Richiesto
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **Node.js**: v18 o superiore
- **PostgreSQL**: v14 o superiore
- **Nginx**: v1.18 o superiore
- **PM2**: Process manager per Node.js

## Setup Iniziale Server

### 1. Aggiornamento Sistema
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip -y
```

### 2. Installazione Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verifica v18+
npm --version   # Verifica v8+
```

### 3. Installazione PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Setup database
sudo -u postgres psql
CREATE DATABASE menuisland_production;
CREATE USER menuisland WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE menuisland_production TO menuisland;
\q
```

### 4. Installazione Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 5. Installazione PM2
```bash
sudo npm install -g pm2
pm2 startup
# Esegui il comando suggerito
```

## Download e Setup Applicazione

### 1. Download Codice
```bash
cd /var/www
sudo mkdir menuisland
sudo chown $USER:$USER menuisland
cd menuisland

# Download da Replit o GitHub
wget https://menuisland-deploy.replit.app/download -O menuisland.zip
unzip menuisland.zip
rm menuisland.zip
```

### 2. Installazione Dipendenze
```bash
npm install
```

### 3. Configurazione Environment
```bash
cp .env.example .env
nano .env
```

Configurare le seguenti variabili nel file `.env`:

```bash
# Database
DATABASE_URL="postgresql://menuisland:your_secure_password@localhost:5432/menuisland_production"

# Server
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Security
SESSION_SECRET="your-super-long-random-session-secret-key-min-32-chars"
COOKIE_SECURE=true
COOKIE_MAX_AGE=86400000

# Domain
DOMAIN=yourdomain.com
BASE_URL=https://yourdomain.com

# Stripe (Obbligatorio per pagamenti)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email (SendGrid consigliato)
SENDGRID_API_KEY=SG.your_sendgrid_api_key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME="MenuIsland"

# Cloudflare (Per sottodomini automatici)
CLOUDFLARE_API_TOKEN=your_cloudflare_token
CLOUDFLARE_ZONE_ID=your_zone_id
CLOUDFLARE_DOMAIN=yourdomain.com

# Google Translate (Opzionale)
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

### 4. Build Applicazione
```bash
# Build con chiave Stripe
VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build
```

### 5. Setup Database
```bash
npm run db:push
```

## Configurazione Nginx

### 1. Configurazione SSL
```bash
# Installazione Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generazione certificato
sudo certbot --nginx -d yourdomain.com -d *.yourdomain.com
```

### 2. Configurazione Virtual Host
```bash
sudo nano /etc/nginx/sites-available/menuisland
```

Inserire la seguente configurazione:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com *.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    server_name yourdomain.com *.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;
    
    # Main proxy configuration
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Static files
    location /uploads {
        alias /var/www/menuisland/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # Image optimization headers
        location ~* \.(jpg|jpeg|png|gif|webp)$ {
            add_header Vary Accept;
        }
    }
    
    # Security - Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|config)$ {
        deny all;
    }
}
```

### 3. Attivazione Configurazione
```bash
sudo ln -s /etc/nginx/sites-available/menuisland /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Configurazione PM2

### 1. File Configurazione
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'menuisland',
    script: 'dist/index.js',
    cwd: '/var/www/menuisland',
    instances: 'max',
    exec_mode: 'cluster',
    
    // Environment
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    
    // Logging
    error_file: '/var/log/pm2/menuisland-error.log',
    out_file: '/var/log/pm2/menuisland-out.log',
    log_file: '/var/log/pm2/menuisland.log',
    time: true,
    
    // Performance
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    
    // Auto restart
    watch: false,
    ignore_watch: ['node_modules', 'uploads', 'logs'],
    
    // Graceful restart
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};
```

### 2. Avvio Applicazione
```bash
# Crea directory logs
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Avvia applicazione
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Setup Backup Automatici

### 1. Script Backup Database
```bash
sudo mkdir -p /var/backups/menuisland
sudo nano /var/scripts/backup-menuisland.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/menuisland"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="menuisland_production"
DB_USER="menuisland"

# Database backup
PGPASSWORD="your_secure_password" pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Application files backup
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" -C /var/www/menuisland uploads .env

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

### 2. Crontab Setup
```bash
sudo chmod +x /var/scripts/backup-menuisland.sh
crontab -e

# Aggiungi le seguenti righe:
# Backup giornaliero alle 2:00
0 2 * * * /var/scripts/backup-menuisland.sh

# Restart PM2 settimanale (domenica alle 3:00)
0 3 * * 0 pm2 restart menuisland

# Rinnovo SSL automatico
0 12 * * * /usr/bin/certbot renew --quiet
```

## Configurazione DNS

### 1. Record DNS Principali
```
A     yourdomain.com          -> IP_SERVER
A     *.yourdomain.com        -> IP_SERVER
CNAME www.yourdomain.com      -> yourdomain.com
```

### 2. Cloudflare Setup (Se utilizzato)
1. Accedi a Cloudflare Dashboard
2. Aggiungi il dominio
3. Configura i record DNS
4. Ottieni API Token e Zone ID
5. Configura nel file `.env`

## Monitoraggio e Manutenzione

### 1. Comandi Utili PM2
```bash
# Status applicazione
pm2 status

# Logs in tempo reale
pm2 logs menuisland

# Restart
pm2 restart menuisland

# Reload (zero-downtime)
pm2 reload menuisland

# Monitoring
pm2 monit
```

### 2. Monitoring Sistema
```bash
# Spazio disco
df -h

# Memoria
free -h

# CPU
top

# Connessioni database
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE datname = 'menuisland_production';"
```

### 3. Log Analysis
```bash
# Nginx access logs
tail -f /var/log/nginx/access.log

# Nginx error logs  
tail -f /var/log/nginx/error.log

# Application logs
pm2 logs menuisland --lines 100

# Database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

## Troubleshooting Comune

### Database Connection Issues
```bash
# Test connessione
sudo -u postgres psql menuisland_production -c "SELECT NOW();"

# Reset password
sudo -u postgres psql
ALTER USER menuisland PASSWORD 'new_password';
```

### Performance Issues
```bash
# Analisi query lente
sudo -u postgres psql menuisland_production -c "SELECT query, calls, total_time, mean_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Restart services
sudo systemctl restart postgresql
sudo systemctl restart nginx
pm2 restart menuisland
```

### SSL Issues
```bash
# Test certificato
sudo certbot certificates

# Rinnovo manuale
sudo certbot renew

# Test configurazione nginx
sudo nginx -t
```

## Aggiornamenti Applicazione

### 1. Backup Pre-Aggiornamento
```bash
# Backup completo
/var/scripts/backup-menuisland.sh

# Backup configurazione
cp .env .env.backup
cp -r uploads uploads.backup
```

### 2. Download Nuova Versione
```bash
cd /var/www/menuisland
wget https://menuisland-deploy.replit.app/download -O update.zip
unzip update.zip -d temp/
```

### 3. Aggiornamento Sicuro
```bash
# Stop applicazione
pm2 stop menuisland

# Backup old version
mv dist dist.old

# Deploy new version
cp -r temp/* .
rm -rf temp update.zip

# Restore configurations
cp .env.backup .env
cp -r uploads.backup/* uploads/

# Install dependencies
npm install

# Build application
VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build

# Database migrations
npm run db:push

# Start application
pm2 start menuisland

# Verify
pm2 logs menuisland --lines 20
```

### 4. Rollback (Se Necessario)
```bash
pm2 stop menuisland
rm -rf dist
mv dist.old dist
pm2 start menuisland
```

## Performance Tuning

### 1. PostgreSQL Optimization
```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
```

### 2. Node.js Optimization
```bash
# Increase file descriptors
echo 'fs.file-max = 65536' | sudo tee -a /etc/sysctl.conf
echo '* soft nofile 65536' | sudo tee -a /etc/security/limits.conf
echo '* hard nofile 65536' | sudo tee -a /etc/security/limits.conf
```

### 3. Nginx Optimization
```nginx
# nginx.conf additions
worker_processes auto;
worker_connections 1024;
sendfile on;
tcp_nopush on;
tcp_nodelay on;
keepalive_timeout 65;
client_max_body_size 10M;
```

## Sicurezza Avanzata

### 1. Firewall Setup
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw deny 5000
```

### 2. Fail2Ban
```bash
sudo apt install fail2ban -y
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

### 3. Log Monitoring
```bash
# Setup logrotate
sudo nano /etc/logrotate.d/menuisland
```

```
/var/log/pm2/menuisland*.log {
    daily
    missingok
    rotate 52
    compress
    notifempty
    create 0644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

Con questa configurazione completa, MenuIsland sarà operativo su server privato con performance ottimali, sicurezza enterprise e sistema di backup robusto.