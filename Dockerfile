FROM node:18-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN mkdir -p emails && chown -R node:node .

EXPOSE 25

ENTRYPOINT ["npm", "run"]

CMD ["start"]