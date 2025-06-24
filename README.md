# MenuIsland - Documentazione Completa

## 📋 Indice
1. [Panoramica del Sistema](#panoramica)
2. [Caratteristiche Principali](#caratteristiche)
3. [Architettura Tecnica](#architettura)
4. [Installazione Server Privato](#installazione)
5. [Guida Utente Completa](#guida-utente)
6. [API Reference](#api-reference)
7. [Database Schema](#database-schema)
8. [Configurazione Avanzata](#configurazione)
9. [Troubleshooting](#troubleshooting)
10. [FAQ e Supporto](#faq)

---

## 📊 Panoramica del Sistema {#panoramica}

MenuIsland è una piattaforma SaaS completa per la gestione di menu digitali per ristoranti, con funzionalità avanzate di analitiche, traduzioni automatiche e gestione clienti.

### Tecnologie Utilizzate
- **Frontend**: React 18 + TypeScript, Vite, TailwindCSS, Shadcn/ui
- **Backend**: Node.js + Express, TypeScript
- **Database**: PostgreSQL con Drizzle ORM
- **Autenticazione**: Sessioni sicure + Replit Auth
- **Pagamenti**: Stripe Integration
- **Email**: SendGrid / Resend
- **Traduzioni**: Google Translate API (opzionale)

### Struttura del Progetto
```
menuisland/
├── client/               # Frontend React
│   ├── src/
│   │   ├── components/   # Componenti UI riutilizzabili
│   │   ├── pages/        # Pagine dell'applicazione
│   │   ├── hooks/        # Custom React hooks
│   │   └── lib/          # Utility e configurazioni
├── server/               # Backend Express
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Database operations
│   ├── simpleAuth.ts     # Sistema autenticazione
│   └── emailService.ts   # Gestione email
├── shared/               # Codice condiviso
│   └── schema.ts         # Database schema & types
└── uploads/              # File caricati dagli utenti
```

---

## 🚀 Caratteristiche Principali {#caratteristiche}

### 🍽️ Gestione Menu
- **Editor Visuale**: Creazione e modifica menu intuitiva
- **Categorie Personalizzabili**: Organizzazione logica dei piatti
- **Gestione Allergeni**: Indicazione dettagliata degli allergeni
- **Upload Immagini**: Foto dei piatti per aumentare l'appeal
- **Prezzi Dinamici**: Aggiornamento rapido dei prezzi

### 🌐 Sistema Multilingue
- **10 Lingue Supportate**: Italiano, Inglese, Francese, Tedesco, Spagnolo, Portoghese, Russo, Cinese, Giapponese, Arabo
- **Traduzione Automatica**: Integrazione Google Translate (opzionale)
- **Rilevamento Lingua Browser**: Selezione automatica della lingua preferita
- **Tracking Utilizzo Lingue**: Analytics dettagliate sull'uso delle lingue

### 🎨 Template e Personalizzazione
- **5 Template Professionali**: Moderno, Elegante, Rustico, Marino, Vintage
- **Anteprima Live**: Visualizzazione in tempo reale delle modifiche
- **Schema Colori Personalizzabili**: Adattamento al brand del ristorante
- **CSS Personalizzato**: Possibilità di modifiche avanzate

### 📊 Analytics Avanzate
- **Dashboard Completa**: Overview delle performance per ristorante
- **Tracking Visite**: Monitoraggio visitatori unici
- **Scansioni QR**: Statistiche dettagliate sui QR code
- **Piatti Più Visualizzati**: Insights sui piatti preferiti
- **Analytics Lingue**: Utilizzo delle traduzioni per mercato

### 🔐 Sistema di Autenticazione
- **Login Sicuro**: Sessioni crittografate
- **Gestione Ruoli**: Admin, Owner, User
- **Password Hashing**: Bcrypt per sicurezza password
- **Reset Password**: Sistema di recupero sicuro

### 💳 Integrazione Pagamenti
- **Stripe Integration**: Pagamenti sicuri con Stripe
- **Piani Flessibili**: Freemium con upgrade premium
- **Fatturazione Automatica**: Gestione abbonamenti ricorrenti
- **Dashboard Pagamenti**: Admin panel per monitoraggio

### 📱 QR Code Generator
- **Generazione Automatica**: QR codes personalizzati per tavoli
- **Download High-Res**: Formati multipli per stampa
- **Tracking Scansioni**: Analytics dettagliate per QR code
- **Personalizzazione**: Logo e colori brand integrati

### 🎯 Sistema Supporto
- **Ticketing System**: Gestione richieste clienti
- **Livelli Priorità**: Urgente, Alta, Media, Bassa
- **Admin Dashboard**: Interfaccia completa per supporto
- **Email Notifications**: Notifiche automatiche per aggiornamenti

---

## 🏗️ Architettura Tecnica {#architettura}

### Frontend Architecture
```
Client (React + TypeScript)
├── Components Layer
│   ├── UI Components (Shadcn)
│   ├── Layout Components
│   └── Business Components
├── State Management
│   ├── TanStack Query (Server State)
│   ├── React Hooks (Local State)
│   └── Context API (Global State)
└── Routing (Wouter)
```

### Backend Architecture
```
Server (Express + TypeScript)
├── API Layer (routes.ts)
├── Business Logic (storage.ts)
├── Authentication (simpleAuth.ts)
├── External Services
│   ├── Email (emailService.ts)
│   ├── Translation (translationService.ts)
│   └── Cloudflare (cloudflareService.ts)
└── Database (PostgreSQL + Drizzle)
```

### Database Design
```
Users (Authentication & Profiles)
├── Restaurants (Multi-tenant)
│   ├── Categories
│   │   └── MenuItems
│   │       └── Allergens (Many-to-Many)
│   ├── QR Codes
│   ├── Analytics
│   └── Template Customizations
├── Support Tickets
├── Client Invitations
└── Email Templates
```

---

## 💻 Installazione Server Privato {#installazione}

### Prerequisiti
- **Node.js**: v18 o superiore
- **PostgreSQL**: v14 o superiore
- **NPM**: v8 o superiore
- **PM2**: Per gestione processi (consigliato)

### 1. Installazione Base

```bash
# Clone repository
git clone https://github.com/your-org/menuisland.git
cd menuisland

# Installa dipendenze
npm install

# Configura database
sudo -u postgres createdb menuisland_production
```

### 2. Configurazione Environment

Crea il file `.env` nella root del progetto:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/menuisland_production"

# Server
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-super-secret-session-key-here

# Stripe (per pagamenti)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=pk_live_your_stripe_public_key

# Email (SendGrid consigliato)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@tuodominio.com
FROM_NAME="MenuIsland Support"

# Cloudflare (per gestione sottodomini)
CLOUDFLARE_API_TOKEN=your-cloudflare-token
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_DOMAIN=menuisland.it

# Google Translate (opzionale)
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key

# Admin Settings
ADMIN_EMAIL=admin@tuodominio.com
```

### 3. Build e Deploy

```bash
# Build applicazione
npm run build

# Migrazione database
npm run db:push

# Start con PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 4. Configurazione Nginx

Crea `/etc/nginx/sites-available/menuisland`:

```nginx
server {
    listen 80;
    server_name menuisland.it *.menuisland.it;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name menuisland.it *.menuisland.it;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy to Node.js
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
    
    # Static files
    location /uploads {
        alias /var/www/menuisland/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 5. Configurazione PM2

Crea `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'menuisland',
    script: 'dist/index.js',
    cwd: '/var/www/menuisland',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/menuisland-error.log',
    out_file: '/var/log/pm2/menuisland-out.log',
    log_file: '/var/log/pm2/menuisland.log',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Installa Certbot
sudo apt install certbot python3-certbot-nginx

# Genera certificato
sudo certbot --nginx -d menuisland.it -d *.menuisland.it

# Auto-renewal
sudo crontab -e
# Aggiungi: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Backup Automatico

Crea `/var/scripts/menuisland-backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/menuisland"
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump menuisland_production > "$BACKUP_DIR/db_$DATE.sql"

# Files backup
tar -czf "$BACKUP_DIR/files_$DATE.tar.gz" -C /var/www/menuisland uploads .env

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
```

Aggiungi al crontab:
```bash
0 2 * * * /var/scripts/menuisland-backup.sh
```

---

## 📖 Guida Utente Completa {#guida-utente}

### Primo Accesso e Setup

#### 1. Registrazione Account
1. Visita `https://tuodominio.com`
2. Clicca "Registrati" 
3. Compila: Email, Password, Nome, Cognome
4. Conferma email (se configurato)
5. Accedi alla dashboard

#### 2. Pagamento e Upgrade
1. **Piano Gratuito**: 1 ristorante, funzionalità base
2. **Piano Premium**: Ristoranti illimitati, analytics avanzate
3. Vai su "Impostazioni" → "Piano e Fatturazione"
4. Clicca "Upgrade a Premium"
5. Inserisci dati carta di credito Stripe
6. Conferma pagamento

### Gestione Ristoranti

#### Creazione Nuovo Ristorante
1. Dashboard → "Nuovo Ristorante"
2. **Informazioni Base**:
   - Nome ristorante
   - Posizione/Indirizzo
   - Logo (opzionale, max 2MB)
3. **Sottodominio**: Es. `ilritrovo` → `ilritrovo.menuisland.it`
4. **Template**: Scegli tra 5 opzioni disponibili
5. Clicca "Crea Ristorante"

#### Configurazione Template
1. Lista Ristoranti → Clicca ristorante → "Modifica"
2. **Template Selection**:
   - **Moderno**: Design pulito e minimale
   - **Elegante**: Stile sofisticato con gradients
   - **Rustico**: Tonalità calde e accoglienti
   - **Marino**: Colori del mare per ristoranti di pesce
   - **Vintage**: Stile retrò con font serif
3. **Anteprima**: Visualizza come apparirà il menu
4. **Personalizzazione Colori**: Modifica schema colori se supportato

### Gestione Menu

#### Creazione Categorie
1. Dashboard → Lista Ristoranti → Icona Menu
2. "Nuova Categoria"
3. **Dettagli**:
   - Nome categoria (es. "Antipasti")
   - Descrizione (opzionale)
   - Ordine di visualizzazione
4. Salva categoria

#### Aggiunta Piatti
1. Seleziona categoria → "Nuovo Piatto"
2. **Informazioni Piatto**:
   - Nome piatto
   - Descrizione dettagliata
   - Prezzo (formato: €15.00)
   - Immagine (opzionale, max 5MB)
   - Ordine visualizzazione
3. **Allergeni**:
   - Seleziona allergeni applicabili
   - Gestione allergeni: Menu → "Allergeni"
4. Salva piatto

#### Gestione Allergeni
1. Menu Principale → "Allergeni"
2. **Allergeni Predefiniti**: Glutine, Lattosio, Uova, ecc.
3. **Nuovo Allergene**:
   - Nome allergene
   - Descrizione (opzionale)
   - Icona/simbolo
4. Associa allergeni ai piatti durante creazione/modifica

### Sistema QR Code

#### Generazione QR Codes
1. Lista Ristoranti → Icona QR Code
2. **Dettagli QR**:
   - Nome/descrizione (es. "Tavolo 1", "Banco Bar")
   - Personalizzazione design (se disponibile)
3. **Download**:
   - PNG alta risoluzione
   - SVG vettoriale
   - PDF pronto per stampa
4. **Tracking**: Ogni QR ha analytics dedicate

#### Stampa e Posizionamento
1. **Dimensioni Consigliate**: Minimo 3x3 cm per leggibilità
2. **Materiali**: Plastificato o laminato per durabilità
3. **Posizionamento**: Ben visibile su ogni tavolo
4. **Backup**: Mantieni QR codes di backup

### Analytics e Monitoraggio

#### Dashboard Analytics
1. Lista Ristoranti → Icona Grafici
2. **Metriche Principali**:
   - Visite totali (ultimi 30 giorni)
   - Scansioni QR code
   - Tasso di conversione QR→Visita
   - Lingue più utilizzate

#### Analytics Dettagliate
1. **Grafici Temporali**:
   - Andamento visite giornaliere
   - Picchi di utilizzo per orari
   - Tendenze settimanali/mensili
2. **Piatti Più Visualizzati**:
   - Ranking piatti per visualizzazioni
   - Categoria di appartenenza
   - Trend temporale interesse
3. **Utilizzo Lingue**:
   - Distribuzione percentuale lingue
   - Crescita mercati internazionali
   - Preferenze clientela

#### Export Dati
1. Analytics → "Export"
2. **Formati**: CSV, Excel, PDF
3. **Periodi**: Ultimi 7/30/90 giorni, personalizzato
4. **Dati Inclusi**: Tutte le metriche o selezione specifica

### Sistema Multilingue

#### Configurazione Traduzioni
1. **Automatiche**: Abilitazione Google Translate
2. **Manuali**: Modifica traduzioni specifiche
3. **Lingue Supportate**:
   - Italiano (default)
   - Inglese, Francese, Tedesco
   - Spagnolo, Portoghese
   - Russo, Cinese, Giapponese, Arabo

#### Ottimizzazione Traduzioni
1. Menu Editor → Lingua → "Gestione Traduzioni"
2. **Revisione Automatiche**: Controlla e correggi
3. **Traduzioni Personalizzate**: Override per termini specifici
4. **Test Funzionalità**: Preview in tutte le lingue

### Gestione Clienti (Admin)

#### Inviti Clienti
1. Admin Panel → "Inviti Clienti"
2. **Nuovo Invito**:
   - Email destinatario
   - Nome ristorante
   - Messaggio personalizzato
   - Data scadenza
3. **Tracking**: Stato inviti (inviato/accettato/scaduto)

#### Gestione Utenti
1. Admin Panel → "Utenti"
2. **Azioni Admin**:
   - Visualizza dettagli utente
   - Modifica limiti ristoranti
   - Gestione stato pagamento
   - Promozione ad admin
3. **Statistiche**: Utenti attivi, paganti, conversioni

### Supporto e Assistenza

#### Sistema Ticket
1. Menu Principale → "Supporto"
2. **Nuova Richiesta**:
   - Oggetto descrittivo
   - Categoria (Tecnico, Fatturazione, Generale)
   - Priorità (Bassa, Media, Alta, Urgente)
   - Descrizione dettagliata
3. **Tracking**: Stato (Aperto, In Lavorazione, Risolto)

#### Canali Supporto
1. **Email**: support@menuisland.it
2. **Chat Live**: 9:00-18:00 (Lun-Ven)
3. **Documentazione**: Guide e FAQ integrate
4. **Video Tutorial**: Playlist YouTube dedicata

---

## 🔌 API Reference {#api-reference}

### Authentication Endpoints

#### POST /api/auth/login
Autenticazione utente

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "hasPaid": true
}
```

#### POST /api/auth/register
Registrazione nuovo utente

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe"
}
```

#### GET /api/auth/user
Ottieni informazioni utente corrente

**Response:**
```json
{
  "id": "user123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "isAdmin": false,
  "hasPaid": true,
  "maxRestaurants": 5
}
```

### Restaurant Management

#### GET /api/restaurants
Lista ristoranti dell'utente

**Response:**
```json
[
  {
    "id": 1,
    "name": "Il Ritrovo",
    "location": "Via Roma 123, Milano",
    "subdomain": "ilritrovo",
    "logoUrl": "/uploads/logos/restaurant1.jpg",
    "templateId": 2,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/restaurants
Crea nuovo ristorante

**Request Body:**
```json
{
  "name": "Nuovo Ristorante",
  "location": "Via Example 456, Roma",
  "subdomain": "nuovoristorante",
  "templateId": 1
}
```

#### PUT /api/restaurants/:id
Aggiorna ristorante

**Request Body:**
```json
{
  "name": "Nome Aggiornato",
  "location": "Nuova Posizione",
  "templateId": 3
}
```

### Menu Management

#### GET /api/restaurants/:id/categories
Lista categorie menu

**Response:**
```json
[
  {
    "id": 1,
    "name": "Antipasti",
    "description": "Selezione di antipasti",
    "order": 1,
    "restaurantId": 1
  }
]
```

#### POST /api/categories
Crea nuova categoria

**Request Body:**
```json
{
  "name": "Primi Piatti",
  "description": "Pasta fresca fatta in casa",
  "restaurantId": 1,
  "order": 2
}
```

#### GET /api/categories/:id/menu-items
Lista piatti della categoria

**Response:**
```json
[
  {
    "id": 1,
    "name": "Spaghetti Carbonara",
    "description": "Pasta con uova, pecorino e guanciale",
    "price": "€14.00",
    "imageUrl": "/uploads/items/carbonara.jpg",
    "order": 1,
    "allergens": [
      {
        "id": 1,
        "name": "Glutine",
        "description": "Contiene glutine"
      }
    ]
  }
]
```

#### POST /api/menu-items
Crea nuovo piatto

**Request Body:**
```json
{
  "name": "Margherita Pizza",
  "description": "Pomodoro, mozzarella, basilico",
  "price": "€12.00",
  "categoryId": 2,
  "order": 1
}
```

### Analytics Endpoints

#### GET /api/analytics/dashboard
Analytics dashboard utente

**Response:**
```json
{
  "totalVisits": 1250,
  "totalScans": 340,
  "totalMenuItems": 45,
  "totalCategories": 8,
  "chartData": [
    {
      "date": "15/01",
      "visits": 25,
      "scans": 8
    }
  ]
}
```

#### GET /api/analytics/restaurant/:id
Analytics dettagliate ristorante

**Query Parameters:**
- `days`: Numero giorni (default: 30)

**Response:**
```json
{
  "totalVisits": 340,
  "totalScans": 89,
  "chartData": [...],
  "mostViewedItems": [
    {
      "name": "Carbonara",
      "views": 45,
      "category": "Primi Piatti"
    }
  ],
  "languageStats": [
    {
      "language": "it",
      "count": 180,
      "percentage": 53
    }
  ]
}
```

### QR Code Management

#### GET /api/restaurants/:id/qr-codes
Lista QR codes del ristorante

**Response:**
```json
[
  {
    "id": 1,
    "name": "Tavolo 1",
    "qrData": "data:image/png;base64,...",
    "restaurantId": 1,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/qr-codes
Genera nuovo QR code

**Request Body:**
```json
{
  "name": "Tavolo 5",
  "restaurantId": 1
}
```

### Support System

#### GET /api/support/tickets
Lista ticket dell'utente

**Response:**
```json
[
  {
    "id": 1,
    "subject": "Problema con upload immagini",
    "message": "Non riesco a caricare foto dei piatti",
    "priority": "medium",
    "status": "open",
    "category": "technical",
    "userEmail": "user@example.com",
    "response": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

#### POST /api/support/tickets
Crea nuovo ticket

**Request Body:**
```json
{
  "subject": "Richiesta funzionalità",
  "message": "Vorrei poter esportare il menu in PDF",
  "priority": "low",
  "category": "feature"
}
```

### Admin Endpoints

#### GET /api/admin/users
Lista tutti gli utenti (Solo Admin)

#### GET /api/admin/support/tickets
Lista tutti i ticket supporto (Solo Admin)

#### PUT /api/admin/support/tickets/:id/response
Risposta a ticket supporto (Solo Admin)

**Request Body:**
```json
{
  "response": "Ciao! Abbiamo risolto il problema. Prova ora."
}
```

---

## 🗄️ Database Schema {#database-schema}

### Tabelle Principali

#### users
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  email VARCHAR UNIQUE,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  is_admin BOOLEAN DEFAULT FALSE,
  role VARCHAR DEFAULT 'user',
  has_paid BOOLEAN DEFAULT FALSE,
  stripe_customer_id VARCHAR,
  stripe_payment_intent_id VARCHAR,
  payment_date TIMESTAMP,
  max_restaurants INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### restaurants
```sql
CREATE TABLE restaurants (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  location VARCHAR,
  subdomain VARCHAR UNIQUE NOT NULL,
  logo_url VARCHAR,
  template_id INTEGER REFERENCES templates(id),
  owner_id VARCHAR REFERENCES users(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### templates
```sql
CREATE TABLE templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR,
  css_styles TEXT,
  color_scheme JSONB,
  is_popular BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### categories
```sql
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### menu_items
```sql
CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  price VARCHAR NOT NULL,
  image_url VARCHAR,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### allergens
```sql
CREATE TABLE allergens (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  description TEXT,
  icon_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### menu_item_allergens
```sql
CREATE TABLE menu_item_allergens (
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  allergen_id INTEGER REFERENCES allergens(id) ON DELETE CASCADE,
  PRIMARY KEY (menu_item_id, allergen_id)
);
```

#### qr_codes
```sql
CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  qr_data TEXT NOT NULL,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### analytics
```sql
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  visits INTEGER DEFAULT 0,
  qr_scans INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0
);
```

#### menu_item_views
```sql
CREATE TABLE menu_item_views (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER REFERENCES menu_items(id) ON DELETE CASCADE,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  viewer_language VARCHAR DEFAULT 'it',
  ip_address VARCHAR,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### menu_language_usage
```sql
CREATE TABLE menu_language_usage (
  id SERIAL PRIMARY KEY,
  restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
  language VARCHAR NOT NULL,
  usage_count INTEGER DEFAULT 1,
  date DATE DEFAULT CURRENT_DATE
);
```

#### support_tickets
```sql
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  subject VARCHAR NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR DEFAULT 'medium',
  status VARCHAR DEFAULT 'open',
  category VARCHAR DEFAULT 'general',
  user_id VARCHAR REFERENCES users(id),
  user_email VARCHAR NOT NULL,
  response TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Relazioni e Indici

#### Indici Principali
```sql
-- Performance indexes
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_analytics_restaurant_date ON analytics(restaurant_id, date);
CREATE INDEX idx_menu_item_views_restaurant ON menu_item_views(restaurant_id);
CREATE INDEX idx_support_tickets_user ON support_tickets(user_id);

-- Unique constraints
ALTER TABLE restaurants ADD CONSTRAINT uk_subdomain UNIQUE (subdomain);
ALTER TABLE users ADD CONSTRAINT uk_email UNIQUE (email);
```

#### Foreign Key Constraints
```sql
-- Cascade deletes for data integrity
ALTER TABLE categories 
  ADD CONSTRAINT fk_categories_restaurant 
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE menu_items 
  ADD CONSTRAINT fk_menu_items_category 
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

ALTER TABLE qr_codes 
  ADD CONSTRAINT fk_qr_codes_restaurant 
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
```

---

## ⚙️ Configurazione Avanzata {#configurazione}

### Variabili Environment

#### Core Application
```bash
# Server Configuration
NODE_ENV=production                    # development | production | test
PORT=5000                             # Server port
HOST=0.0.0.0                         # Bind address

# Session & Security
SESSION_SECRET=your-super-secret-key   # Min 32 characters
COOKIE_SECURE=true                    # HTTPS only cookies
COOKIE_MAX_AGE=86400000              # Session duration (24h)

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com    # Frontend URL
CORS_CREDENTIALS=true                 # Allow credentials
```

#### Database Configuration
```bash
# PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/dbname
DB_POOL_MIN=2                        # Minimum connections
DB_POOL_MAX=10                       # Maximum connections
DB_IDLE_TIMEOUT=10000                # Idle timeout (ms)
DB_SSL_MODE=require                  # SSL mode for production
```

#### External Services
```bash
# Stripe Payments
STRIPE_SECRET_KEY=sk_live_...         # Live secret key
STRIPE_WEBHOOK_SECRET=whsec_...       # Webhook endpoint secret
VITE_STRIPE_PUBLIC_KEY=pk_live_...    # Public key for frontend

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.xxx              # SendGrid API key
FROM_EMAIL=noreply@yourdomain.com     # Default sender
FROM_NAME=MenuIsland                  # Default sender name

# Alternative: Resend
RESEND_API_KEY=re_xxx                # Resend API key

# Google Translate (Optional)
GOOGLE_TRANSLATE_API_KEY=AIza...      # Google Cloud API key
TRANSLATE_PROJECT_ID=your-project     # Google Cloud Project ID
```

#### Cloudflare Integration
```bash
# Domain Management
CLOUDFLARE_API_TOKEN=xxx              # Cloudflare API token
CLOUDFLARE_ZONE_ID=xxx               # Zone ID for domain
CLOUDFLARE_DOMAIN=menuisland.it      # Base domain
SUBDOMAIN_TTL=1                      # DNS TTL for subdomains
```

#### File Upload & Storage
```bash
# Local Storage
UPLOAD_DIR=./uploads                  # Upload directory
MAX_FILE_SIZE=5242880                # Max file size (5MB)
ALLOWED_EXTENSIONS=jpg,jpeg,png,gif   # Allowed file types

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=AKIA...            # AWS access key
AWS_SECRET_ACCESS_KEY=xxx            # AWS secret key
AWS_REGION=eu-west-1                 # AWS region
AWS_BUCKET_NAME=menuisland-uploads   # S3 bucket name
```

#### Monitoring & Logging
```bash
# Application Logs
LOG_LEVEL=info                       # error | warn | info | debug
LOG_FORMAT=json                     # json | simple
LOG_DIR=./logs                      # Log directory

# Performance Monitoring
ENABLE_METRICS=true                 # Enable performance metrics
METRICS_PORT=9090                   # Metrics endpoint port

# Error Tracking (Sentry)
SENTRY_DSN=https://xxx@sentry.io/xxx # Sentry DSN for error tracking
```

### Personalizzazione Template

#### CSS Personalizzato
```css
/* Template CSS Structure */
.restaurant-header {
  /* Header styling */
  background: linear-gradient(135deg, #2C3E50 0%, #3498DB 100%);
  color: white;
  padding: 2rem;
  text-align: center;
}

.menu-category {
  /* Category styling */
  border-left: 4px solid var(--accent-color);
  background: var(--secondary-color);
  padding: 1rem;
  margin: 1rem 0;
  border-radius: 8px;
}

.menu-item {
  /* Menu item styling */
  border-bottom: 1px solid var(--border-color);
  padding: 1rem;
  transition: background-color 0.2s;
}

.menu-item:hover {
  background: var(--hover-color);
}

.price {
  color: var(--primary-color);
  font-weight: bold;
  font-size: 1.1em;
}
```

#### Schema Colori JSON
```json
{
  "primary": "#2C3E50",
  "secondary": "#E8F4FD", 
  "accent": "#3498DB",
  "text": "#2C3E50",
  "background": "#FFFFFF",
  "border": "#E8F4FD",
  "hover": "#F8FBFF"
}
```

### Ottimizzazioni Performance

#### Database Ottimizzazioni
```sql
-- Vacuum e analyze regolari
VACUUM ANALYZE;

-- Statistiche aggiornate
UPDATE pg_stat_user_tables SET n_tup_ins = 0;

-- Index maintenance
REINDEX DATABASE menuisland_production;

-- Query slow log
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();
```

#### Node.js Tuning
```javascript
// ecosystem.config.js advanced
module.exports = {
  apps: [{
    name: 'menuisland',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size',
      '--max-semi-space-size=128'
    ],
    env: {
      NODE_ENV: 'production',
      UV_THREADPOOL_SIZE: 128
    }
  }]
};
```

#### Nginx Ottimizzazioni
```nginx
# Compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# Caching
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req zone=api burst=20 nodelay;

# Security headers
add_header X-Content-Type-Options nosniff always;
add_header X-Frame-Options DENY always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

---

## 🔧 Troubleshooting {#troubleshooting}

### Problemi Comuni e Soluzioni

#### 1. Errori Database Connection

**Problema**: `Error: connect ECONNREFUSED`
```bash
# Verifica stato PostgreSQL
sudo systemctl status postgresql

# Restart se necessario
sudo systemctl restart postgresql

# Check configurazione
sudo -u postgres psql -c "SHOW port;"
sudo -u postgres psql -c "SHOW listen_addresses;"
```

**Problema**: `password authentication failed`
```bash
# Reset password PostgreSQL
sudo -u postgres psql
ALTER USER username PASSWORD 'newpassword';

# Verifica pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf
# local   all   all   md5
```

#### 2. Upload Immagini Fallisce

**Problema**: Immagini non si caricano
```bash
# Verifica permessi directory
ls -la uploads/
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/

# Verifica spazio disco
df -h

# Check logs
tail -f /var/log/pm2/menuisland-error.log
```

**Problema**: "File too large"
```javascript
// Aumenta limite in server/index.ts
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

#### 3. Problemi Stripe Pagamenti

**Problema**: "Invalid API key"
```bash
# Verifica variabili environment
echo $STRIPE_SECRET_KEY
echo $VITE_STRIPE_PUBLIC_KEY

# Test API key
curl https://api.stripe.com/v1/customers \
  -H "Authorization: Bearer $STRIPE_SECRET_KEY"
```

**Problema**: Webhook non funziona
```bash
# Verifica endpoint webhook
curl -X POST https://yourdomain.com/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check Stripe logs su dashboard
```

#### 4. Problemi Email

**Problema**: Email non inviate
```bash
# Test SendGrid
curl -X POST https://api.sendgrid.com/v3/mail/send \
  -H "Authorization: Bearer $SENDGRID_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"personalizations":[{"to":[{"email":"test@example.com"}]}],"from":{"email":"test@yourdomain.com"},"subject":"Test","content":[{"type":"text/plain","value":"Test"}]}'

# Verifica DNS SPF/DKIM
dig TXT yourdomain.com
```

#### 5. SSL/HTTPS Issues

**Problema**: Certificato scaduto
```bash
# Verifica scadenza
openssl x509 -in /path/to/cert.pem -text -noout | grep "Not After"

# Rinnova Let's Encrypt
sudo certbot renew --dry-run
sudo certbot renew
sudo systemctl reload nginx
```

**Problema**: Mixed content errors
```nginx
# Forza HTTPS redirect
if ($scheme != "https") {
    return 301 https://$host$request_uri;
}
```

#### 6. Performance Issues

**Problema**: Server lento
```bash
# Monitor risorse
htop
iotop
df -h

# PM2 monitoring
pm2 monit
pm2 logs menuisland --lines 100

# Database performance
sudo -u postgres psql menuisland_production -c "
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;"
```

**Problema**: High memory usage
```javascript
// Ottimizza PM2 config
module.exports = {
  apps: [{
    max_memory_restart: '512M',  // Riduci limite
    node_args: '--max-old-space-size=512'
  }]
};
```

### Log Analysis

#### PM2 Logs
```bash
# Tutti i logs
pm2 logs

# Solo errori
pm2 logs menuisland --err

# Real-time monitoring
pm2 logs menuisland --lines 0

# Logs specifici per data
pm2 logs --timestamp
```

#### Nginx Logs
```bash
# Access logs
tail -f /var/log/nginx/access.log

# Error logs
tail -f /var/log/nginx/error.log

# Analisi top requests
awk '{print $7}' /var/log/nginx/access.log | sort | uniq -c | sort -nr | head -10
```

#### Database Logs
```bash
# PostgreSQL logs
tail -f /var/log/postgresql/postgresql-14-main.log

# Query slow
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Backup e Recovery

#### Database Backup
```bash
#!/bin/bash
# backup-database.sh
BACKUP_DIR="/var/backups/menuisland"
DATE=$(date +%Y%m%d_%H%M%S)

# Full backup
pg_dump menuisland_production | gzip > "$BACKUP_DIR/full_$DATE.sql.gz"

# Schema only
pg_dump --schema-only menuisland_production > "$BACKUP_DIR/schema_$DATE.sql"

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete
```

#### Database Restore
```bash
# Restore da backup
gunzip -c /var/backups/menuisland/full_20240115_120000.sql.gz | \
  sudo -u postgres psql menuisland_production

# Restore solo schema
sudo -u postgres psql menuisland_production < schema_backup.sql
```

#### Files Backup
```bash
# Backup files
tar -czf /var/backups/menuisland/files_$(date +%Y%m%d).tar.gz \
  -C /var/www/menuisland uploads .env

# Restore files
tar -xzf files_backup.tar.gz -C /var/www/menuisland/
```

---

## ❓ FAQ e Supporto {#faq}

### Domande Frequenti

#### Q: Come aumentare il limite di ristoranti?
**A**: Gli admin possono modificare il limite tramite Admin Panel → Utenti → Modifica utente → Max ristoranti. Il limite predefinito è 1 per utenti gratuiti, illimitato per premium.

#### Q: È possibile cambiare sottodominio dopo creazione?
**A**: Sì, tramite modifica ristorante. Attenzione: i QR code esistenti dovranno essere ristampati con il nuovo URL.

#### Q: Come configurare email personalizzate?
**A**: Admin Panel → Email Templates. Personalizza oggetto e contenuto con variabili come {{name}}, {{restaurant}}, {{url}}.

#### Q: Posso esportare i dati del menu?
**A**: Attualmente non implementato. Feature pianificata per versioni future (export PDF, Excel).

#### Q: Come funziona la traduzione automatica?
**A**: Se configurata Google Translate API, le traduzioni sono automatiche. Altrimenti, i menu rimangono in lingua originale con selezione manuale.

#### Q: Posso personalizzare completamente il design?
**A**: Limitato ai template disponibili e personalizzazione colori. Per modifiche CSS avanzate, contattare supporto.

#### Q: Quali sono i limiti del piano gratuito?
**A**: 1 ristorante, template base, analytics limitati. Premium offre ristoranti illimitati, tutti i template, analytics avanzate.

#### Q: Come funziona il sistema di fatturazione?
**A**: Pagamento unico per upgrade a premium. Nessun rinnovo automatico attualmente. Possibile implementare abbonamenti ricorrenti.

#### Q: È possibile integrare sistemi POS?
**A**: Non attualmente supportato. Feature considerata per versioni future.

#### Q: Come gestire più lingue manualmente?
**A**: Menu Editor → Gestione Traduzioni → Seleziona lingua → Modifica traduzioni specifiche.

### Supporto Tecnico

#### Canali di Supporto
1. **Email Priority**: support@menuisland.it
2. **Sistema Ticket**: Interfaccia integrata nell'app
3. **Documentazione**: Guide complete online
4. **Community**: Forum utenti (se implementato)

#### Livelli di Supporto
- **Basic** (Gratuito): Email, ticket system, documentation
- **Premium** (Paganti): Priorità nelle risposte, chat support
- **Enterprise** (Custom): Support dedicato, SLA definiti

#### Informazioni da Includere nelle Richieste
1. **User ID / Email** account interessato
2. **Restaurant ID** se problema specifico
3. **Browser/Device** utilizzato
4. **Steps to Reproduce** il problema
5. **Screenshots** se applicabile
6. **Error Messages** completi
7. **Timeline** quando è iniziato il problema

### Roadmap Features

#### Versione 2.0 (Q2 2024)
- [ ] Export menu PDF/Excel
- [ ] Integrazione sistemi POS
- [ ] Template builder avanzato
- [ ] Multi-location per catene
- [ ] App mobile nativa

#### Versione 2.1 (Q3 2024)  
- [ ] Prenotazioni online
- [ ] Sistema recensioni
- [ ] Integrazione social media
- [ ] Analytics predittive
- [ ] API pubblica per integrazioni

#### Versione 3.0 (Q4 2024)
- [ ] AI menu optimization
- [ ] Dynamic pricing
- [ ] Inventory management
- [ ] Staff management
- [ ] White-label solution

### Risorse Aggiuntive

#### Link Utili
- **Demo Live**: https://demo.menuisland.it
- **GitHub Repository**: https://github.com/your-org/menuisland
- **Status Page**: https://status.menuisland.it
- **Blog/Updates**: https://blog.menuisland.it

#### Community e Learning
- **Video Tutorials**: YouTube Channel
- **Webinar Mensili**: Training per nuovi utenti
- **Case Studies**: Esempi di successo
- **Best Practices**: Guide ottimizzazione

#### Partner Program
- **Web Agencies**: Commissioni per referral
- **Reseller Program**: Prezzi scontati per volumi
- **Integration Partners**: API access privilegiato

---

## 📝 Note di Versione

### Versione 1.5.0 (Corrente)
- ✅ Sistema supporto completo con ticketing
- ✅ Analytics avanzate per ristorante
- ✅ Menu redesign mobile-first
- ✅ Tracking visualizzazioni piatti
- ✅ Sistema traduzioni migliorato
- ✅ Template preview system
- ✅ SSL e sicurezza ottimizzati

### Versione 1.4.0
- ✅ Integrazione Stripe pagamenti
- ✅ Sistema admin completo
- ✅ QR code generator
- ✅ Email templates
- ✅ Multi-template support

### Versione 1.3.0
- ✅ Sistema allergeni
- ✅ Upload immagini
- ✅ Analytics base
- ✅ Gestione categorie e piatti

### Versione 1.2.0
- ✅ Autenticazione e registrazione
- ✅ Gestione ristoranti
- ✅ Sistema sottodomini
- ✅ Template base

### Versione 1.1.0
- ✅ Setup iniziale progetto
- ✅ Database schema
- ✅ API foundation
- ✅ Frontend structure

---

**Documentazione completa MenuIsland v1.5.0**  
*Ultimo aggiornamento: Gennaio 2025*  
*Per supporto: support@menuisland.it*
