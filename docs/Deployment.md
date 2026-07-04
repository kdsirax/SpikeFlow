# Deployment & Production Setup

This document details the configuration and scripts required to deploy SpikeFlow in local development and production environments.

---

## 1. Local Development (Docker Compose)

For development, SpikeFlow spin-up uses a single `docker-compose.yml` defining the proxy (NGINX), core gateway (Node.js/Apollo Server), and mock backend container services.

```yaml
version: '3.8'

services:
  # NGINX Edge Proxy
  nginx-proxy:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - graphql-gateway

  # Core GraphQL Gateway Engine
  graphql-gateway:
    build:
      context: ./gateway
      dockerfile: Dockerfile
    ports:
      - "4000:4000"
    environment:
      - PORT=4000
      - DATABASE_URL=postgres://postgres:postgres@postgres-db:5432/spikeflow
      - REDIS_URL=redis://redis-cache:6379
    depends_on:
      - postgres-db
      - redis-cache

  # Mock Stateful Services Container
  users-service:
    build: ./services/users
    environment:
      - PORT=5001
      - DATABASE_URL=postgres://postgres:postgres@postgres-db:5432/spikeflow

  # Databases & Caches
  postgres-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=spikeflow
    ports:
      - "5432:5432"

  redis-cache:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

## 2. NGINX Configuration Template (`nginx.conf`)

This configuration sits at the entry path of incoming client connections.

```nginx
events { worker_connections 1024; }

http {
    # Define client rate limiting zone (10 requests per second per IP)
    limit_req_zone $binary_remote_addr zone=api_limit_zone:10m rate=10r/s;

    upstream gateway_server {
        server graphql-gateway:4000;
    }

    server {
        listen 80;

        location /graphql {
            # Apply rate limiting
            limit_req zone=api_limit_zone burst=5 nodelay;
            limit_req_status 429;

            # Reverse proxy headers
            proxy_pass http://gateway_server;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Health probe endpoint
        location /health {
            access_log off;
            add_header Content-Type text/plain;
            return 200 'healthy';
        }
    }
}
```

---

## 3. Serverless Deployment Strategy

The serverless operations of SpikeFlow (such as expensive analytics or product catalogs searches) are packaged and deployed independently to function-as-a-service (FaaS) runtimes.

```
┌─────────────────────────────────┐
│     GraphQL Resolver Code       │
└────────────────┬────────────────┘
                 │
      [ PreferredRuntime check ]
                 │
       ┌─────────┴─────────┐
       ▼                   ▼
  [ DOCKER ]         [ SERVERLESS ]
       │                   │
  HTTP Proxy          AWS SDK / Lambda Invoke
       │                   │
       ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  Docker App  │    │  AWS Lambda  │
└──────────────┘    └──────────────┘
```

### 3.1 AWS Lambda Integration (Serverless Framework `serverless.yml`)
To deploy individual stateless query resolvers as Lambda functions:

```yaml
service: spikeflow-stateless-functions

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    NODE_ENV: production

functions:
  searchProducts:
    handler: src/handlers/search.handler
    events:
      - httpApi:
          path: /search-products
          method: post

  generateInvoice:
    handler: src/handlers/invoice.handler
    timeout: 30 # Allow longer runtimes for invoices
```

### 3.2 Production Scaling Strategy
1. **Container Auto-scaling (ECS/Fargate):** Core containers scale on average CPU utilization targets (e.g. scale up when average CPU > 75%).
2. **Serverless Auto-scaling:** Lambda scale-out is handled natively by AWS. The Gateway manages connection throttling using RDS Proxy to avoid overwhelming the database under heavy concurrent lambda invocation.
