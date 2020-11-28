FROM node:alpine
WORKDIR '/demo-app'

COPY package.json .
RUN npm install
COPY . .
CMD ["npm","start"]