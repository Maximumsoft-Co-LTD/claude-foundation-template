---
type: concept
tags: [devops, docker, containers, images, dockerfile]
related: [CON-cicd-pipeline, CON-container-orchestration, CON-infrastructure-as-code]
updated: 2026-03-25
source: template
---

# Containerization (Docker)

## Why Containers?

"Works on my machine" → Docker makes it work everywhere.

Container = isolated environment with: app code + runtime + dependencies + config
Image = blueprint for container (read-only, versioned)
Container = running instance of image

## Key Concepts

```
Dockerfile  → instructions to build image
Image       → built artifact (immutable, versioned)
Container   → running image instance
Registry    → image storage (Docker Hub, ECR, ghcr.io)
Volume      → persistent storage outside container
Network     → how containers communicate
```

## Dockerfile Best Practices

```dockerfile
# ✅ Good Dockerfile
# 1. Start with specific version tag (not 'latest')
FROM node:20.11-alpine AS base

# 2. Set working directory
WORKDIR /app

# 3. Copy package files first (layer caching)
COPY package*.json ./

# 4. Install dependencies (cached if package.json unchanged)
RUN npm ci --only=production

# 5. Copy source after deps (cache miss only on code change)
COPY . .

# 6. Multi-stage build (smaller final image)
FROM base AS builder
RUN npm run build

FROM node:20.11-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# 7. Non-root user for security
RUN addgroup -S app && adduser -S app -G app
USER app

# 8. Document port
EXPOSE 3000

# 9. Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
```

## Layer Caching Strategy

```
Docker builds layers top to bottom.
If a layer changes, all subsequent layers rebuild.

ORDER MATTERS:
  1. Base image (rarely changes)
  2. System dependencies
  3. Package files (package.json)
  4. npm install (only if package.json changed)
  5. Source code (changes often)

❌ Bad: COPY . . before npm install
   → Every code change → reinstall all deps

✅ Good: COPY package*.json → npm install → COPY . .
   → Code change → skip install, use cache
```

## Docker Compose (Local Dev)

```yaml
# docker-compose.yml
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://user:pass@db:5432/myapp
      REDIS_URL: redis://redis:6379
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src  # Hot reload in dev

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

## Image Size Optimization

```
Goal: smallest image = faster pulls = less attack surface

Techniques:
  1. Use Alpine variants (node:20-alpine vs node:20 → 180MB vs 1GB)
  2. Multi-stage builds (only copy build artifacts to final stage)
  3. .dockerignore file (exclude node_modules, .git, tests)
  4. RUN apt-get clean && rm -rf /var/lib/apt/lists/* after installs
  5. Combine RUN commands: RUN cmd1 && cmd2 && cmd3

.dockerignore:
  node_modules
  .git
  .env
  *.test.ts
  docs/
```

## Container Security

```
✅ Use non-root user (USER app)
✅ Specific image tags (not :latest)
✅ Scan images for vulnerabilities (Trivy, Snyk)
✅ Read-only filesystem where possible
✅ Secrets via env vars or secrets manager (not COPY into image)
✅ Minimal base image (Alpine, distroless)
```

## Related

- [[CON-cicd-pipeline]] — build + push images in CI
- [[CON-container-orchestration]] — run containers at scale
- [[CON-infrastructure-as-code]] — define infra alongside containers
- [[../../../00-MOC/MOC-DevOps]]
