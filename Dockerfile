# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build Angular app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built Angular app
COPY --from=builder /app/dist/monpotager/browser ./dist

# Copy backend server and API
COPY server ./server

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R node:node /app/uploads

# Use non-root user
USER node

# Expose port
EXPOSE 3000

# Start the Express server
CMD ["node", "server/index.js"]
