FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/
COPY apps/dashboard/package*.json ./apps/dashboard/

RUN npm install --ignore-scripts

COPY apps/api/prisma ./apps/api/prisma
WORKDIR /app/apps/api
RUN npx prisma generate

WORKDIR /app
COPY apps/worker ./apps/worker
WORKDIR /app/apps/worker
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install Docker CLI and Git for image builds and repository cloning
RUN apk add --no-cache docker-cli git

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/
COPY apps/dashboard/package*.json ./apps/dashboard/

RUN npm install --production --ignore-scripts

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/apps/worker/dist ./apps/worker/dist

WORKDIR /app/apps/worker

CMD ["node", "dist/index.js"]
