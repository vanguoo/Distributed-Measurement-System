FROM node:13.12.0-alpine
WORKDIR '/demo-app'

COPY package.json ./
RUN npm install --registry=https://registry.npm.taobao.org 

COPY . .
CMD ["npm","start"]
