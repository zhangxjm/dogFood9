FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --production && mkdir -p /app/data

COPY . .

ENV DB_DIR=/app/data

EXPOSE 3001

CMD ["node", "index.js"]
