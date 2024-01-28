# Development
FROM node:21.5.0 as base
WORKDIR /home/node/app
COPY package*.json ./
RUN npm i
COPY . .

# Production
FROM base as production
# ENV NODE_PATH=./app
RUN npm i -g nodemon ts-node && npm i
