# Development
FROM node:16 as base
WORKDIR /home/node/app
COPY package*.json ./
RUN npm i
COPY . .

# Production
FROM base as production
ENV NODE_PATH=./app
RUN npm i && npm run build
