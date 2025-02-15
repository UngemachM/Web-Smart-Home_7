FROM node:18
WORKDIR /app

# 1. Kopiere nur package.json und package-lock.json, um Cache zu nutzen
COPY package.json package-lock.json ./
RUN npm install

# 2. Kopiere restliche Dateien (z.B. src, index.js)
COPY . .

# 3. Baue das React-Frontend
RUN npm run build

# 4. Starte Fastify-Server
CMD ["node", "index.js"]
