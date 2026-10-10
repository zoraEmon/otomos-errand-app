FROM node:20-alpine

# Install OpenSSL for Prisma query engine compatibility on Alpine
RUN apk add --no-cache openssl

WORKDIR /usr/src/app

# Copy package configurations
COPY shared/package*.json ./shared/
COPY server/package*.json ./server/

# Install shared dependencies
WORKDIR /usr/src/app/shared
RUN npm install

# Install server dependencies (this resolves the file:../shared link)
WORKDIR /usr/src/app/server
RUN npm install

# Copy application source code
WORKDIR /usr/src/app
COPY shared ./shared
COPY server ./server

# Generate Prisma Client
WORKDIR /usr/src/app/server
RUN npx prisma generate

EXPOSE 3000

# Start the development server using tsx
CMD ["npm", "run", "dev"]