# Usa una imagen base oficial de Node.js
FROM node:20-alpine
ENV NODE_ENV=development
ENV PORT=3001
WORKDIR /app

COPY package*.json ./
COPY .env ./
COPY .gitignore ./

RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "start"]