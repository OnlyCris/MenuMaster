# Guida Aggiornamento App MenuIsland

## 🔧 Problemi Risolti
- ✅ Errori API traduzione (fallback silenzioso)
- ✅ Problemi certificato SSL (headers sicurezza)
- ✅ Menu ristorante ottimizzato per mobile
- ✅ Pagina menu HTML statica (niente più errori JS)
- ✅ Sistema Stripe con chiavi dinamiche

## 📱 Aggiornamento sul Server

### 1. Backup Configurazione
```bash
cd /var/www/menuisland
cp .env .env.backup
cp -r uploads uploads.backup 2>/dev/null || true
```

### 2. Download Nuova Versione
```bash
# Scarica la versione aggiornata
wget https://menuisland-deploy.replit.app/download -O menuisland-update.zip
unzip menuisland-update.zip -d menuisland-temp/

# Sostituisci i file mantenendo configurazioni
cp -r menuisland-temp/* .
rm -rf menuisland-temp menuisland-update.zip

# Ripristina configurazioni
cp .env.backup .env
cp -r uploads.backup/* uploads/ 2>/dev/null || true
```

### 3. Installa Dipendenze e Build
```bash
# Installa nuove dipendenze
npm install

# Build con chiave Stripe (importante!)
VITE_STRIPE_PUBLIC_KEY=$(grep VITE_STRIPE_PUBLIC_KEY .env | cut -d '=' -f2) npm run build
```

### 4. Riavvia Applicazione
```bash
pm2 restart menuisland
pm2 logs menuisland --lines 10
```

## 🔍 Verifica Funzionamento

### Test Menu Ristorante
```bash
# Testa il menu (sostituisci con il tuo sottodominio)
curl -I https://ilritrovo.menuisland.it
```

### Controlla Logs
```bash
# Nessun errore di traduzione dovrebbe apparire
pm2 logs menuisland | grep -i "translation\|error"
```

## ⚙️ Configurazioni Aggiuntive

### Variabili .env Opzionali
Aggiungi al tuo `.env` se desideri le traduzioni:
```bash
# Opzionale: per traduzioni automatiche
GOOGLE_TRANSLATE_API_KEY=your_google_translate_key_here
```

### Headers SSL Nginx (Se necessario)
Se usi nginx, aggiungi questi headers:
```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
```

## 🚀 Comando Build Completo per Futuri Aggiornamenti
```bash
cd /var/www/menuisland
source .env && npm run build
pm2 restart menuisland
```

## ✅ Cosa è Stato Migliorato
- Menu ristorante ora è una pagina HTML ottimizzata per mobile
- Nessun errore console per traduzioni mancanti  
- Certificati SSL gestiti correttamente
- Stripe funziona con chiavi dinamiche
- Sidebar mobile con menu hamburger
- Tutte le pagine responsive

Il menu del ristorante ora funzionerà perfettamente su mobile senza errori di console o problemi SSL.