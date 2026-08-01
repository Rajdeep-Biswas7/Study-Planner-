# Multi-stage Dockerfile for Study Planner App

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Backend & Runner
FROM node:20-alpine
WORKDIR /app

# Copy backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copy backend code and AI module
COPY backend/ ./backend/
COPY ai/ ./ai/

# Copy built static frontend assets into backend public dir
COPY --from=frontend-build /app/frontend/dist ./backend/public

EXPOSE 4000
ENV PORT=4000
ENV NODE_ENV=production

CMD ["node", "backend/server.js"]
