#!/bin/bash

# MenuIsland Update Script
# Aggiorna l'applicazione dal server di sviluppo

set -e

echo "🚀 Inizio aggiornamento MenuIsland..."

# Verifica che siamo nella directory corretta
if [ ! -f "package.json" ]; then
    echo "❌ Errore: Eseguire lo script dalla directory root di MenuIsland"
    exit 1
fi

# Backup configurazione
echo "📦 Backup configurazione..."
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# Download nuova versione
echo "⬇️ Download aggiornamenti..."
curl -L -o menuisland-update.zip "https://menuisland.replit.app/download"

if [ ! -f "menuisland-update.zip" ]; then
    echo "❌ Errore: Download fallito"
    exit 1
fi

# Estrazione
echo "📂 Estrazione file..."
unzip -q menuisland-update.zip -d temp-update/

# Backup file importanti
echo "💾 Backup file utente..."
[ -d "uploads" ] && cp -r uploads temp-backup-uploads/ || true

# Copia nuovi file
echo "🔄 Applicazione aggiornamenti..."
cp -r temp-update/* .

# Ripristina configurazione e file utente
echo "🔧 Ripristino configurazione..."
if [ -f ".env.backup.$(date +%Y%m%d_%H%M%S | head -1)" ]; then
    cp .env.backup.$(date +%Y%m%d_%H%M%S | head -1) .env
else
    # Se non esiste backup, crea .env con configurazione database locale
    if [ ! -f ".env" ]; then
        echo "📝 Creazione configurazione database locale..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://menuisland:menuisland@localhost:5432/menuisland

# Application
NODE_ENV=production
PORT=3000

# Aggiungi qui le tue chiavi API se necessarie
# STRIPE_SECRET_KEY=
# VITE_STRIPE_PUBLIC_KEY=
# RESEND_API_KEY=
# GOOGLE_TRANSLATE_API_KEY=
# CLOUDFLARE_API_TOKEN=
# CLOUDFLARE_ZONE_ID=
EOF
    fi
fi
[ -d "temp-backup-uploads" ] && cp -r temp-backup-uploads/* uploads/ || true

# Setup database se necessario
echo "🗄️ Verifica configurazione database..."
if ! grep -q "DATABASE_URL" .env 2>/dev/null; then
    echo "📝 Configurazione database mancante, setup automatico..."
    ./setup-database.sh
fi

# Installa dipendenze
echo "📚 Installazione dipendenze..."
npm install

# Esegui migrazione database
echo "🔄 Migrazione database..."
npm run db:push || echo "⚠️ Migrazione fallita - controllare configurazione database"

# Build con variabili d'ambiente
echo "🏗️ Build applicazione..."
source .env
if [ -n "$VITE_STRIPE_PUBLIC_KEY" ]; then
    VITE_STRIPE_PUBLIC_KEY=$VITE_STRIPE_PUBLIC_KEY npm run build
else
    echo "⚠️ Warning: VITE_STRIPE_PUBLIC_KEY non trovata, build senza chiave Stripe"
    npm run build
fi

# Pulizia file temporanei
echo "🧹 Pulizia..."
rm -rf temp-update/ temp-backup-uploads/ menuisland-update.zip

# Riavvio applicazione
echo "🔄 Riavvio applicazione..."
pm2 restart menuisland || echo "⚠️ PM2 restart fallito - riavviare manualmente"

echo "✅ Aggiornamento completato!"
echo ""
echo "📋 Verifica stato:"
echo "   pm2 status menuisland"
echo "   pm2 logs menuisland"
echo ""
echo "🌐 Test sito:"
echo "   curl -I https://menuisland.it"