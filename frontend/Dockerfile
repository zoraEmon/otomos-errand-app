FROM node:20-alpine

WORKDIR /usr/src/app

COPY shared/package*.json ./shared/
COPY frontend/package*.json ./frontend/

WORKDIR /usr/src/app/shared
RUN npm install

WORKDIR /usr/src/app/frontend
RUN npm install

COPY shared ./shared
COPY frontend ./frontend

WORKDIR /usr/src/app/frontend

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
