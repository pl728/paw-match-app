FROM node:20-alpine

WORKDIR /app

# Install dependencies first (layer caching — only re-runs if package files change)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

EXPOSE 4516

CMD ["node", "main.js"]
