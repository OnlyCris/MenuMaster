#!/bin/bash

# MenuIsland Database Setup Script
# Configura il database PostgreSQL locale per MenuIsland

set -e

echo "🗄️ Configurazione database MenuIsland..."

# Verifica se PostgreSQL è installato
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL non trovato. Installazione..."
    sudo apt update
    sudo apt install -y postgresql postgresql-contrib
fi

# Avvia PostgreSQL se non è attivo
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crea utente e database
echo "👤 Creazione utente e database..."
sudo -u postgres psql << 'EOF'
-- Crea utente menuisland se non esiste
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'menuisland') THEN
        CREATE USER menuisland WITH PASSWORD 'menuisland';
    END IF;
END
$$;

-- Crea database se non esiste
SELECT 'CREATE DATABASE menuisland OWNER menuisland' 
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'menuisland')\gexec

-- Assegna privilegi
GRANT ALL PRIVILEGES ON DATABASE menuisland TO menuisland;
ALTER USER menuisland CREATEDB;
EOF

# Testa connessione
echo "🔌 Test connessione database..."
if PGPASSWORD=menuisland psql -h localhost -U menuisland -d menuisland -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database configurato correttamente!"
else
    echo "❌ Errore connessione database"
    exit 1
fi

# Crea file .env se non esiste
if [ ! -f ".env" ]; then
    echo "📝 Creazione file .env..."
    cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://menuisland:menuisland@localhost:5432/menuisland

# Application
NODE_ENV=production
PORT=3000

# Stripe Configuration (opzionale)
# STRIPE_SECRET_KEY=sk_live_your_key
# VITE_STRIPE_PUBLIC_KEY=pk_live_your_key

# Email Service (opzionale)
# RESEND_API_KEY=re_your_key

# Translation Service (opzionale)
# GOOGLE_TRANSLATE_API_KEY=your_key

# Cloudflare DNS (opzionale)
# CLOUDFLARE_API_TOKEN=your_token
# CLOUDFLARE_ZONE_ID=your_zone_id
EOF
    echo "✅ File .env creato"
fi

echo ""
echo "🎉 Setup database completato!"
echo ""
echo "📋 Prossimi passi:"
echo "   1. Esegui: npm run db:push"
echo "   2. Avvia app: npm run build && pm2 start dist/index.js --name menuisland"
echo ""
echo "🔗 Connessione database:"
echo "   Host: localhost"
echo "   Database: menuisland"
echo "   User: menuisland"
echo "   Password: menuisland"