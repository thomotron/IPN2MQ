FROM node:14-alpine

WORKDIR /app/

COPY package.json package-lock.json app.js amqpWrapper.js config.json ./

RUN npm install

ENV NODE_ENV=production

EXPOSE 8080/tcp

ENTRYPOINT ["node", "app.js"]