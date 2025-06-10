# MenuIsland - Guida Completa al Deploy su VPS Debian 12

## Download del Progetto
Scarica il progetto completo da: `https://menuisland-deploy.replit.app/download`

## Prerequisiti
- VPS con Debian 12
- Accesso root al server
- Dominio menuisland.it configurato per puntare al VPS

## 1. Preparazione del Server

### Aggiorna il sistema
```bash
apt update && apt upgrade -y
```

### Installa Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs
```

### Installa PostgreSQL 15
```bash
apt install postgresql postgresql-contrib -y
systemctl start postgresql
systemctl enable postgresql
```

### Installa Nginx
```bash
apt install nginx -y
systemctl start nginx
systemctl enable nginx
```

### Installa PM2
```bash
npm install -g pm2
```

### Installa strumenti di utilità
```bash
apt install unzip curl wget git -y
```

## 2. Configurazione PostgreSQL

### Configura autenticazione PostgreSQL
```bash
sudo -u postgres sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/" /etc/postgresql/*/main/postgresql.conf
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
sudo sed -i "s/local   all             postgres                                peer/local   all             postgres                                md5/" /etc/postgresql/*/main/pg_hba.conf
systemctl restart postgresql
```

### Imposta password per postgres
```bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'MenuIsland2024!Strong';"
```

### Crea database e utente
```bash
sudo -u postgres createdb menuisland
sudo -u postgres psql -c "CREATE USER menuisland WITH ENCRYPTED PASSWORD 'MenuIsland2024!DB';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE menuisland TO menuisland;"
sudo -u postgres psql -c "ALTER DATABASE menuisland OWNER TO menuisland;"
```

## 3. Deploy dell'Applicazione

### Crea directory e scarica il progetto
```bash
mkdir -p /var/www/menuisland
cd /var/www/menuisland
wget https://menuisland-deploy.replit.app/download -O menuisland.zip
unzip menuisland.zip
rm menuisland.zip
```

### Installa dipendenze
```bash
npm install
```

### Crea file di configurazione
```bash
cat > .env << 'EOF'
NODE_ENV=production
DATABASE_URL=postgresql://menuisland:MenuIsland2024!DB@localhost:5432/menuisland
SESSION_SECRET=MenuIsland2024!SessionSecret!VeryLongAndSecure!RandomString!
REPLIT_DOMAINS=menuisland.it,www.menuisland.it
REPL_ID=menuisland-production
RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET_KEY_HERE
VITE_STRIPE_PUBLIC_KEY=pk_live_YOUR_STRIPE_PUBLIC_KEY_HERE
EOF
```

### Build dell'applicazione
```bash
npm run build
```

### Configura database
```bash
npm run db:push
```

### Imposta permessi
```bash
chown -R www-data:www-data /var/www/menuisland
```

## 4. Configurazione Nginx

### Crea configurazione principale
```bash
cat > /etc/nginx/sites-available/menuisland << 'EOF'
# Configurazione per dominio principale
server {
    listen 80;
    server_name menuisland.it www.menuisland.it;

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
        proxy_redirect off;
        proxy_buffering off;
    }
}

# Configurazione per sottodomini ristoranti
server {
    listen 80;
    server_name ~^(?<subdomain>.+)\.menuisland\.it$;

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
        proxy_redirect off;
        proxy_buffering off;
    }
}
EOF
```

### Attiva configurazione
```bash
ln -s /etc/nginx/sites-available/menuisland /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

## 5. Configurazione SSL con Certbot

### Installa Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### Ottieni certificato SSL per dominio principale
```bash
certbot --nginx -d menuisland.it -d www.menuisland.it
```

### Ottieni certificato wildcard per sottodomini
```bash
certbot certonly --manual --preferred-challenges=dns -d *.menuisland.it
```

Segui le istruzioni per aggiungere il record TXT DNS.

### Aggiorna configurazione Nginx con SSL wildcard
```bash
cat > /etc/nginx/sites-available/menuisland << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name menuisland.it www.menuisland.it *.menuisland.it;
    return 301 https://$server_name$request_uri;
}

# Dominio principale HTTPS
server {
    listen 443 ssl http2;
    server_name menuisland.it www.menuisland.it;

    ssl_certificate /etc/letsencrypt/live/menuisland.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menuisland.it/privkey.pem;

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
        proxy_redirect off;
        proxy_buffering off;
    }
}

# Sottodomini ristoranti HTTPS
server {
    listen 443 ssl http2;
    server_name ~^(?<subdomain>.+)\.menuisland\.it$;

    ssl_certificate /etc/letsencrypt/live/menuisland.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menuisland.it/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_Set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
        proxy_buffering off;
    }
}
EOF

systemctl reload nginx
```

## 6. Avvio dell'Applicazione

### Avvia con PM2
```bash
cd /var/www/menuisland
pm2 start npm --name "menuisland" -- start
pm2 save
pm2 startup
```

### Esegui il comando suggerito da PM2 startup (esempio)
```bash
# Copia e incolla il comando suggerito da PM2, sarà simile a:
# sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
```

## 7. Configurazione Firewall

### Configura UFW
```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 8. Configurazione DNS

Aggiungi questi record DNS al tuo provider:

```
A       menuisland.it           IP_DEL_TUO_VPS
A       www.menuisland.it       IP_DEL_TUO_VPS
A       *.menuisland.it         IP_DEL_TUO_VPS
```

## 9. Configurazione API Keys

### Modifica file .env con le tue chiavi reali
```bash
nano /var/www/menuisland/.env
```

Sostituisci:
- `re_YOUR_RESEND_API_KEY_HERE` con la tua chiave Resend
- `sk_live_YOUR_STRIPE_SECRET_KEY_HERE` con la tua chiave segreta Stripe
- `pk_live_YOUR_STRIPE_PUBLIC_KEY_HERE` con la tua chiave pubblica Stripe

### Riavvia l'applicazione
```bash
pm2 restart menuisland
```

## 10. Backup Automatico

### Crea script di backup
```bash
mkdir -p /backup/scripts
cat > /backup/scripts/backup-menuisland.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/menuisland"
mkdir -p $BACKUP_DIR

# Backup database
pg_dump -U menuisland -h localhost menuisland > $BACKUP_DIR/db_backup_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/files_backup_$DATE.tar.gz /var/www/menuisland

# Mantieni solo gli ultimi 7 backup
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
EOF

chmod +x /backup/scripts/backup-menuisland.sh
```

### Aggiungi a crontab
```bash
(crontab -l 2>/dev/null; echo "0 2 * * * /backup/scripts/backup-menuisland.sh") | crontab -
```

## 11. Monitoraggio

### Comandi utili
```bash
# Stato dell'applicazione
pm2 status

# Log dell'applicazione
pm2 logs menuisland

# Monitoraggio risorse
pm2 monit

# Riavvia applicazione
pm2 restart menuisland

# Stato Nginx
systemctl status nginx

# Stato PostgreSQL
systemctl status postgresql

# Log Nginx
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 12. Aggiornamenti

### Per aggiornare l'applicazione
```bash
cd /var/www/menuisland
pm2 stop menuisland
git pull origin main  # se usi git
# oppure sovrascrivi i file manualmente
npm install
npm run build
npm run db:push
pm2 start menuisland
```

## Test Finale

1. Visita https://menuisland.it - dovrebbe caricare la dashboard
2. Crea un account e un ristorante
3. Verifica che il sottodominio funzioni: https://nomeristorante.menuisland.it
4. Testa i pagamenti Stripe
5. Controlla le email Resend

## Risoluzione Problemi

### Se l'app non si avvia
```bash
pm2 logs menuisland
```

### Se il database non si connette
```bash
sudo -u postgres psql -c "\l"
systemctl status postgresql
```

### Se Nginx non funziona
```bash
nginx -t
systemctl status nginx
```

### Se SSL non funziona
```bash
certbot certificates
certbot renew --dry-run
```

Il progetto dovrebbe essere completamente funzionante su https://menuisland.it con sottodomini per i ristoranti.