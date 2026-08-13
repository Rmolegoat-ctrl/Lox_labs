FROM node:20-alpine

WORKDIR /app

# Installer les dépendances du backend
COPY backend/package*.json ./backend/

RUN cd backend && npm install --omit=dev

# Copier tout le projet
COPY . .

# Railway fournit automatiquement PORT
EXPOSE 8080

CMD ["node", "backend/server.js"]
