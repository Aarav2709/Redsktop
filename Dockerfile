FROM node:20-slim

WORKDIR /app
COPY server/package.json server/tsconfig.json ./server/
COPY server/src ./server/src
RUN cd server && npm install && npm run build

EXPOSE 4000
CMD ["node", "./server/dist/index.js"]
