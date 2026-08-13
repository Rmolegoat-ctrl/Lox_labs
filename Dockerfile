FROM node:20-alpine

WORKDIR /app

COPY backend/package*.json ./backend/

RUN cd backend && npm install --omit=dev

COPY . .

EXPOSE 8080

CMD ["node", "backend/server.js"]
