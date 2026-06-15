# Use Node.js 18 on Alpine Linux
FROM node:18-alpine

# Install system dependencies first (needed for canvas, sharp, face-api.js)
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    python3 \
    py3-setuptools \
    make \
    gcc

# Set working directory inside container
WORKDIR /app

# Copy backend package.json and package-lock.json first
COPY backend/package*.json ./

# Pin npm version to avoid node-gyp errors
RUN npm install -g npm@10

# Install backend dependencies
RUN npm install

# Copy backend source code
COPY backend/ .

# Create required directories
RUN mkdir -p uploads models

# Expose backend port
EXPOSE 5000

# Start the backend server
CMD ["node", "src/server.js"]
