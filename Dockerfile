# Multi-stage build per ottimizzare le dimensioni
FROM node:18-alpine as builder

WORKDIR /app

# Copia i file di configurazione
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY components.json ./

# Installa le dipendenze
RUN npm ci --only=production

# Copia il codice sorgente
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build dell'applicazione
RUN npm run build

# Fase di produzione
FROM node:18-alpine

WORKDIR /app

# Installa solo le dipendenze di produzione
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia i file buildati
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

# Crea directory per upload se non esiste
RUN mkdir -p uploads

# Espone la porta
EXPOSE 5000

# Variabili di ambiente
ENV NODE_ENV=production
ENV PORT=5000

# Comando di avvio
CMD ["node", "dist/index.js"]