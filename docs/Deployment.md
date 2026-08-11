# SpikeFlow Deployment, Containerization & Infrastructure Orchestration

## 1. Deployment Topology

SpikeFlow is packaged as a multi-container Docker Compose architecture comprising six dedicated service nodes:

```
                                  INTERNET / INGRESS
                                          │
                                          ▼
                            ┌───────────────────────────┐
                            │    NGINX Perimeter Proxy  │
                            │        (Port 80)          │
                            └─────────────┬─────────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     ▼                                         ▼
        ┌──────────────────────────┐              ┌──────────────────────────┐
        │  Next.js Management UI   │              │   SpikeFlow Core Gateway │
        │        (Port 3000)       │              │        (Port 4000)       │
        └──────────────────────────┘              └────────────┬─────────────┘
                                                               │
                                  ┌────────────────────────────┼────────────────────────────┐
                                  ▼                            ▼                            ▼
                     ┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
                     │   Upstream Microservice  │ │      PostgreSQL 17       │ │         Redis 8        │
                     │  (Product Service :5000) │ │       (Port 5432)        │ │       (Port 6379)      │
                     └──────────────────────────┘ └──────────────────────────┘ └──────────────────────────┘
```

---

## 2. Docker Compose Production Configuration

The canonical orchestration manifest (`docker-compose.yml`) defines all networking, environment parameters, and container restart policies:

```yaml
version: "3.9"

services:
  postgres:
    image: postgres:17
    container_name: spikeflow-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-khushal3526}
      POSTGRES_DB: ${POSTGRES_DB:-spikeflow}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:8-alpine
    container_name: spikeflow-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  spikeflow:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    container_name: spikeflow
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-khushal3526}@postgres:5432/${POSTGRES_DB:-spikeflow}?schema=public
      REDIS_URL: redis://redis:6379
      PORT: 4000
    ports:
      - "4000:4000"

  product-service:
    build:
      context: ./product-service
      dockerfile: Dockerfile
    container_name: product-service
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://${POSTGRES_USER:-postgres}:${POSTGRES_PASSWORD:-khushal3526}@postgres:5432/${POSTGRES_DB:-spikeflow}?schema=public
      PORT: 5000
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: spikeflow-frontend
    restart: unless-stopped
    depends_on:
      - spikeflow
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:4000/graphql
    ports:
      - "3000:3000"

  nginx:
    image: nginx:alpine
    container_name: spikeflow-nginx
    restart: unless-stopped
    depends_on:
      - spikeflow
    ports:
      - "80:80"
    volumes:
      - ./nginx/spikeflow.conf:/etc/nginx/conf.d/default.conf:ro

volumes:
  postgres_data:
  redis_data:
```

---

## 3. Operational Runbook

### Starting All Services
```bash
docker compose up --build -d
```

### Checking Container Health Status
```bash
docker compose ps
```

### Inspecting Gateway Telemetry Logs
```bash
docker compose logs -f spikeflow
```

### Graceful Teardown
```bash
docker compose down
```
