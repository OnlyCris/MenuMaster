# Download Diretto su VPS

## Metodo 1: Git Clone (Raccomandato)

Se hai accesso a un repository Git, è il metodo più pulito:

```bash
# Sul tuo VPS
cd /var/www/
git clone https://github.com/tuorepo/menuisland.git
cd menuisland
npm install
npm run build
```

## Metodo 2: Download via Replit

Usa l'URL diretto del progetto Replit:

```bash
# Sul tuo VPS
cd /var/www/
wget -O menuisland.zip "https://replit.com/@username/project-name/archive/main.zip"
unzip menuisland.zip
mv project-name-main menuisland
cd menuisland
```

## Metodo 3: Transfer via SCP

Dal tuo computer locale:

```bash
# Crea ZIP locale senza node_modules
zip -r menuisland-clean.zip . -x "node_modules/*" ".git/*" "uploads/*" "*.sqlite*" "dist/*" ".env"

# Upload su VPS
scp menuisland-clean.zip root@your-server:/var/www/

# Sul VPS
cd /var/www/
unzip menuisland-clean.zip -d menuisland
cd menuisland
```

## Metodo 4: Sync diretto via rsync

```bash
# Dal computer locale al VPS (esclude automaticamente file non necessari)
rsync -avz --exclude='node_modules' --exclude='.git' --exclude='uploads' --exclude='*.sqlite*' --exclude='dist' --exclude='.env' ./ root@your-server:/var/www/menuisland/
```

## Configurazione Post-Download

Dopo aver scaricato il codice con qualsiasi metodo:

```bash
# Sul VPS
cd /var/www/menuisland

# Crea file .env
nano .env
```

Inserisci nel file .env:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://menuisland:your_password@localhost:5432/menuisland
SESSION_SECRET=your_very_long_random_session_secret

# Le tue chiavi API (necessarie)
STRIPE_SECRET_KEY=sk_live_...
VITE_STRIPE_PUBLIC_KEY=pk_live_...
CLOUDFLARE_API_TOKEN=your_token
CLOUDFLARE_ZONE_ID=your_zone_id
RESEND_API_KEY=re_...
```

Quindi:
```bash
# Installazione e build
npm install
npm run build

# Setup database
npm run db:push

# Test avvio
npm start
```

## URL Replit Diretto

Se preferisci scaricare direttamente da Replit, l'URL è:
`https://replit.com/@cricroloche/workspace-name`

Sostituisci `workspace-name` con il nome effettivo del tuo progetto Replit.