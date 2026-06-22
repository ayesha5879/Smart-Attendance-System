# Use Node.js 18 on Debian Slim
FROM node:18-slim

# Install system dependencies needed for canvas and sharp runtime
RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

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
