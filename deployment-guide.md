# MenuIsland - Guida Deployment VPS

## Prerequisiti
- Server Ubuntu/Debian con accesso root
- Nginx installato  
- Node.js 18+ installato
- Dominio configurato (menuisland.it)

## 1. Preparazione Server

### Installazione Node.js (se non presente)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## 2. Setup Database SQLite

Il database SQLite viene creato automaticamente dall'applicazione al primo avvio.
Non servono configurazioni aggiuntive del database.

## 3. Deploy Applicazione

### Upload e installazione
```bash
# Upload del file ZIP sul server
scp menuisland-vps-complete.zip root@your-server:/var/www/

# Sul server
cd /var/www/
unzip menuisland-vps-complete.zip -d menuisland
cd menuisland
chown -R www-data:www-data /var/www/menuisland

# Installazione dipendenze
npm install

# Build applicazione
npm run build
```

### Configurazione environment
```bash
# Il file .env.production è già incluso nel pacchetto
# Rinominalo semplicemente in .env
mv .env.production .env

# Le chiavi API sono già configurate, il database SQLite sarà creato automaticamente
```

### Inizializzazione database
```bash
npm run db:push
```

## 4. Configurazione Nginx

### File configurazione principale
```bash
nano /etc/nginx/sites-available/menuisland
```

```nginx
# Configurazione per dominio principale
server {
    listen 80;
    server_name menuisland.it www.menuisland.it;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name menuisland.it www.menuisland.it;

    # SSL Configuration (dopo aver ottenuto certificati SSL)
    ssl_certificate /etc/letsencrypt/live/menuisland.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menuisland.it/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Static files
    location /uploads/ {
        alias /var/www/menuisland/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /assets/ {
        alias /var/www/menuisland/dist/public/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
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

# Configurazione wildcard per sottodomini ristoranti
server {
    listen 80;
    server_name *.menuisland.it;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name *.menuisland.it;

    # SSL Configuration (wildcard certificate)
    ssl_certificate /etc/letsencrypt/live/menuisland.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menuisland.it/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    # Static files
    location /uploads/ {
        alias /var/www/menuisland/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
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
```

### Attivazione configurazione
```bash
ln -s /etc/nginx/sites-available/menuisland /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## 5. Certificati SSL

### Installazione Certbot
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### Ottenimento certificati
```bash
# Certificato wildcard (richiede validazione DNS)
certbot certonly --manual --preferred-challenges dns -d menuisland.it -d *.menuisland.it

# Seguire le istruzioni per aggiungere record TXT DNS
```

## 6. Configurazione Systemd Service

### Creazione service file
```bash
nano /etc/systemd/system/menuisland.service
```

```ini
[Unit]
Description=MenuIsland Node.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/menuisland
ExecStart=/usr/bin/node server/index.js
Restart=on-failure
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=menuisland
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

### Avvio servizio
```bash
systemctl daemon-reload
systemctl enable menuisland
systemctl start menuisland
systemctl status menuisland
```

## 7. Configurazione Cloudflare

### DNS Records
Nel pannello Cloudflare, aggiungi:
```
A    menuisland.it      YOUR_SERVER_IP    Proxied
A    *.menuisland.it    YOUR_SERVER_IP    DNS Only (importante!)
```

### Configurazione Cloudflare API
L'applicazione creerà automaticamente record DNS per i sottodomini dei ristoranti usando l'API Cloudflare.

## 8. Setup Amministratore

### Accesso database per impostare admin
```bash
sudo -u postgres psql menuisland
```

```sql
-- Dopo aver fatto login la prima volta, trova il tuo ID utente
SELECT * FROM users WHERE email = 'tua-email@example.com';

-- Imposta il tuo utente come admin
UPDATE users SET "isAdmin" = true WHERE email = 'tua-email@example.com';
```

## 9. Monitoraggio e Logs

### Visualizzare logs applicazione
```bash
journalctl -u menuisland -f
```

### Logs Nginx
```bash
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### Monitoraggio risorse
```bash
htop
systemctl status menuisland
```

## 10. Backup

### Script backup database
```bash
nano /home/backup-menuisland.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Database SQLite backup
cp /var/www/menuisland/menuisland.sqlite $BACKUP_DIR/menuisland_db_$DATE.sqlite

# Files backup
tar -czf $BACKUP_DIR/menuisland_files_$DATE.tar.gz /var/www/menuisland/uploads

# Keep only last 7 days
find $BACKUP_DIR -name "menuisland_*" -mtime +7 -delete
```

### Crontab per backup automatico
```bash
crontab -e
# Aggiungi: 0 2 * * * /home/backup-menuisland.sh
```

## Note Importanti

1. **Sicurezza**: Cambia tutte le password predefinite
2. **Firewall**: Configura UFW per aprire solo porte necessarie (80, 443, 22)
3. **Updates**: Mantieni aggiornato il sistema
4. **Monitoring**: Imposta monitoraggio uptime per il servizio
5. **API Keys**: Assicurati di avere chiavi API valide per Stripe, Cloudflare e Resend

## Troubleshooting

### Problemi comuni
- **502 Bad Gateway**: Verifica che il servizio Node.js sia attivo
- **Certificati SSL**: Assicurati che i certificati siano validi e non scaduti
- **Database**: Verifica connessione DATABASE_URL
- **Sottodomini**: Controlla record DNS wildcard in Cloudflare

### Riavvio completo
```bash
systemctl restart menuisland
systemctl restart nginx
systemctl restart postgresql
```