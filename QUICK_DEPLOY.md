# MenuIsland - Deploy Rapido VPS Debian 12

## Download e Setup Iniziale

### 1. Connessione e preparazione server
```bash
# Connetti al VPS
ssh root@your-vps-ip

# Aggiorna sistema
apt update && apt upgrade -y

# Installa dipendenze base
apt install -y curl wget unzip nginx postgresql postgresql-contrib
```

### 2. Installa Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
npm install -g pm2
```

### 3. Configura PostgreSQL (FIX AUTHENTICATION)
```bash
# Modifica configurazione autenticazione
sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
sed -i "s/local   all             postgres                                peer/local   all             postgres                                md5/" /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql

# Imposta password postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'MenuIsland2024!';"

# Crea database
sudo -u postgres createdb menuisland
sudo -u postgres psql -c "CREATE USER menuisland WITH ENCRYPTED PASSWORD 'MenuIslandDB2024!';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE menuisland TO menuisland;"
```

### 4. Download e setup applicazione
```bash
# Crea directory
mkdir -p /var/www/menuisland
cd /var/www/menuisland

# Scarica progetto
wget https://427f86c9-cc01-4eee-85fa-a81383a9333f-00-1zam1z3mzexa9.riker.replit.dev/download -O menuisland.zip
unzip menuisland.zip
rm menuisland.zip

# Installa dipendenze
npm install
```

### 5. Configura ambiente
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://menuisland:MenuIslandDB2024!@localhost:5432/menuisland
SESSION_SECRET=MenuIsland2024!SuperSecretSessionKey!VeryLongString!
REPLIT_DOMAINS=menuisland.it,www.menuisland.it
REPL_ID=menuisland-production
RESEND_API_KEY=re_YOUR_RESEND_API_KEY
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_STRIPE_PUBLIC_KEY
EOF
```

### 6. Build e database
```bash
npm run build
npm run db:push
chown -R www-data:www-data /var/www/menuisland
```

### 7. Configura Nginx
```bash
cat > /etc/nginx/sites-available/menuisland << 'EOF'
server {
    listen 80;
    server_name menuisland.it www.menuisland.it *.menuisland.it;
    
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
}
EOF

ln -s /etc/nginx/sites-available/menuisland /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

### 8. SSL con Certbot
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d menuisland.it -d www.menuisland.it
certbot certonly --manual --preferred-challenges=dns -d *.menuisland.it
```

### 9. Avvia applicazione
```bash
cd /var/www/menuisland
pm2 start npm --name "menuisland" -- start
pm2 save
pm2 startup
# Esegui il comando suggerito da PM2
```

### 10. Firewall
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## Test Finale
- Visita: https://menuisland.it
- Crea account e ristorante
- Testa sottodominio: https://test.menuisland.it

## Configurazione DNS Necessaria
```
A    menuisland.it        IP_VPS
A    www.menuisland.it    IP_VPS  
A    *.menuisland.it      IP_VPS
```

## Comandi Utili
```bash
# Status app
pm2 status

# Log app  
pm2 logs menuisland

# Riavvia app
pm2 restart menuisland

# Test database
sudo -u postgres psql -d menuisland -c "SELECT version();"
```