FROM node:20-slim

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --production=false
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

EXPOSE 4000
CMD ["npm", "run", "start"]
