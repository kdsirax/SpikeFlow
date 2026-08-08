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

# Build TypeScript
RUN npm run build

# Expose application port
EXPOSE 4000

# Start the application
CMD ["npm", "start"]