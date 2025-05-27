FROM node:20

WORKDIR /app

COPY package*.json ./
COPY .env .env
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]