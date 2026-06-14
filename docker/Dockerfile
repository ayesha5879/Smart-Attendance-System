FROM node:18-alpine

# Install system dependencies for canvas and face-api.js
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

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm install

# Copy backend source
COPY backend/ .

# Create required directories
RUN mkdir -p uploads models

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "src/server.js"]