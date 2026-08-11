# Base Image
FROM node:22-alpine

# Working directory inside the container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the remaining source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Expose application port
EXPOSE 4000

# Push DB migrations/schema on startup and launch gateway
CMD ["sh", "-c", "npx prisma db push && npm start"]