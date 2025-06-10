# Guida Setup Database MenuIsland

## Problema Database URL

Se ricevi l'errore `DATABASE_URL must be set`, segui questi passi:

### Opzione 1: Setup Automatico (Raccomandato)

```bash
cd /var/www/menuisland
curl -s https://menuisland.replit.app/setup-database.sh | bash
```

### Opzione 2: Setup Manuale

1. **Installa PostgreSQL** (se non presente):
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

2. **Crea database e utente**:
```bash
sudo -u postgres psql
```

Nel prompt PostgreSQL:
```sql
CREATE USER menuisland WITH PASSWORD 'menuisland';
CREATE DATABASE menuisland OWNER menuisland;
GRANT ALL PRIVILEGES ON DATABASE menuisland TO menuisland;
ALTER USER menuisland CREATEDB;
\q
```

3. **Crea file .env**:
```bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://menuisland:menuisland@localhost:5432/menuisland
NODE_ENV=production
PORT=3000
EOF
```

4. **Testa connessione**:
```bash
PGPASSWORD=menuisland psql -h localhost -U menuisland -d menuisland -c "SELECT version();"
```

### Verifica Setup

1. **Controlla che il database funzioni**:
```bash
source .env
echo $DATABASE_URL
```

2. **Esegui migrazione database**:
```bash
npm run db:push
```

3. **Avvia applicazione**:
```bash
npm run build
pm2 restart menuisland
```

### Troubleshooting Comuni

**Errore: peer authentication failed**
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Cambia 'peer' in 'md5' per local connections
sudo systemctl restart postgresql
```

**Errore: password authentication failed**
```bash
sudo -u postgres psql
ALTER USER menuisland PASSWORD 'menuisland';
```

**Errore: database does not exist**
```bash
sudo -u postgres createdb -O menuisland menuisland
```

### Configurazione Avanzata

Per ambienti di produzione, modifica `.env`:
```bash
# Database più sicuro
DATABASE_URL=postgresql://menuisland:password_sicura@localhost:5432/menuisland

# Aggiungi servizi esterni
STRIPE_SECRET_KEY=sk_live_your_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_key
RESEND_API_KEY=re_your_key
GOOGLE_TRANSLATE_API_KEY=your_key
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id
```