# Development
FROM node:18.14.2 as base
WORKDIR /home/node/app
COPY package*.json ./
RUN npm i
COPY . .
# EXPOSE 8234

# Production
FROM base as production
# ENV NODE_PATH=./app
RUN npm i -g nodemon ts-node && npm i