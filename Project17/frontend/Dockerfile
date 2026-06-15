FROM node:18-alpine

WORKDIR /app

COPY package.json ./

RUN npm install --registry=https://registry.npmmirror.com

COPY . .

RUN npm run build

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
