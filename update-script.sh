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
cp .env.backup.$(date +%Y%m%d_%H%M%S | head -1) .env
[ -d "temp-backup-uploads" ] && cp -r temp-backup-uploads/* uploads/ || true

# Installa dipendenze
echo "📚 Installazione dipendenze..."
npm install

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