FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/dashboard/package*.json ./apps/dashboard/
COPY apps/api/package*.json ./apps/api/
COPY apps/worker/package*.json ./apps/worker/

RUN npm install --ignore-scripts

COPY apps/dashboard ./apps/dashboard
WORKDIR /app/apps/dashboard
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
COPY apps/dashboard/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
