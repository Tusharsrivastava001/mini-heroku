FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Create non-root group and user
RUN addgroup -S appgroup -g 1001 && adduser -S appuser -u 1001 -G appgroup

COPY package*.json ./
RUN npm install --only=production

COPY --chown=appuser:appgroup . .
USER appuser

EXPOSE 3000
CMD ["npm", "start"]
