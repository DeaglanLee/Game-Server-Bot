FROM alpine:3.21.3

USER root

WORKDIR /GameServer

COPY package*.json ./

RUN apk add --no-cache nodejs npm bash aws-cli screen
RUN apk update && apk upgrade

RUN npm install

COPY . .

ENTRYPOINT [ "node", "bot.js" ]