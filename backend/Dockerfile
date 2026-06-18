# Stage 1: Build stage
FROM node:20-slim AS builder
WORKDIR /app

# Install build dependencies for native modules (better-sqlite3, bcrypt)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies (including devDependencies for TypeScript build & Prisma generation)
COPY package*.json ./
RUN npm ci

# Copy source and config files
COPY . .

# Generate Prisma client and compile NestJS code
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runtime stage
FROM node:20-slim
WORKDIR /app
RUN mkdir -p /app/data

# Copy built application and client generator artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.* ./

EXPOSE 3000

# Copy start script to manage DB migrations and seeding
COPY start.sh ./
RUN chmod +x start.sh

ENTRYPOINT ["./start.sh"]
