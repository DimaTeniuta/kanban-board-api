FROM node:20-alpine

WORKDIR /app

COPY package*.json package-lock.json .npmrc ./

RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
