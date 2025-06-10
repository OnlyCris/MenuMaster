# Guida SSL per MenuIsland

## Problema Certificato SSL Attuale
Il sito mostra "Non sicuro" perché il certificato SSL non corrisponde al dominio `da-marco.menuisland.it`.

## Soluzioni SSL

### Opzione 1: Certificato Wildcard (Consigliato)
```bash
# Installa certbot se non presente
sudo apt install certbot python3-certbot-nginx

# Genera certificato wildcard per tutti i sottodomini
sudo certbot certonly --manual --preferred-challenges=dns -d "*.menuisland.it" -d "menuisland.it"

# Segui le istruzioni per aggiungere il record DNS TXT
# Aggiungi nel tuo pannello DNS:
# Nome: _acme-challenge.menuisland.it
# Tipo: TXT
# Valore: [valore fornito da certbot]
```

### Opzione 2: Certificato per Sottodominio Specifico
```bash
# Per un singolo sottodominio
sudo certbot certonly --webroot -w /var/www/menuisland/dist/public -d da-marco.menuisland.it
```

### Configurazione Nginx per SSL
```nginx
server {
    listen 443 ssl http2;
    server_name *.menuisland.it menuisland.it;
    
    ssl_certificate /etc/letsencrypt/live/menuisland.it/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/menuisland.it/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name *.menuisland.it menuisland.it;
    return 301 https://$server_name$request_uri;
}
```

### Auto-rinnovo Certificato
```bash
# Aggiungi crontab per auto-rinnovo
sudo crontab -e

# Aggiungi questa riga:
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```