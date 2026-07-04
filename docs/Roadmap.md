# SpikeFlow Project Roadmap

This roadmap traces the phased progression of SpikeFlow from a local MVP into a production-grade, self-healing GraphQL traffic execution gateway.

---

## 🚀 Phase 1: Core Foundation & MVP (Current)
*Focus: Define the basic schema, setup typescript configuration, and establish working gateway loops.*
- [x] Initial Repository scaffolding (Express, Apollo Server, TypeScript compiler setups).
- [x] Define Core `User` and base schemas.
- [x] Create mock data in-memory structure for local testing.
- [x] Setup type-safety interfaces and resolve schema-resolver type mismatch.
- [x] Introduce mutation and query wrappers (`addUser`, `updateUser`, `users`).

---

## 🐳 Phase 2: Hybrid Runtime Scaffolding
*Focus: Introduce multi-target execution environments.*
- [ ] Containerize gateway and core mock database (PostgreSQL/Redis setup via `docker-compose.yml`).
- [ ] Create mock Serverless execution endpoints (using local endpoints or LocalStack mock environment).
- [ ] Setup metadata configuration attributes for API operations (marking which query requires DB connection vs. which is stateless).
- [ ] Establish initial static resolver routing: direct search queries to serverless target and writes/CRUD to container targets.

---

## 🛡️ Phase 3: Perimeter Traffic & Security Control
*Focus: Implement traffic policies at the gateway's boundary.*
- [ ] Setup NGINX as reverse-proxy and deploy to frontend.
- [ ] Define rate limiting rules at NGINX (`limit_req_zone` configuration).
- [ ] Implement query cost analysis middleware in the GraphQL Gateway to reject overly complex nested queries before execution.
- [ ] Add Redis-backed token/rate limiting buckets for API consumer applications.

---

## 🧠 Phase 4: Intelligent Decision Engine
*Focus: Build the real-time dynamic routing and spike mitigation system.*
- [ ] Write dynamic scoring algorithm parsing CPU/Memory stats and operation properties.
- [ ] Build the rolling-window traffic volume (RPM) counter in Redis.
- [ ] Write active failover logic: when container health metrics degrade or request rate spikes, transparently route non-stateful queries to Serverless.
- [ ] Store historical `Request` audit log entries for every routing event, noting execution times and routing justification strings.

---

## 📊 Phase 5: Developer Dashboard
*Focus: Give visibility into the gateway operations.*
- [ ] Design and implement a React or Next.js developer dashboard.
- [ ] Integrate real-time graphs showing requests per minute (RPM) and response time distributions.
- [ ] Render a live telemetry map of the routing decision history (inspecting why a request went to Docker vs Serverless).
- [ ] Provide a control panel for editing Routing Rules and rate-limiting limits dynamically.

---

## 🔒 Phase 6: Production Hardening
*Focus: Prepare for real-world traffic scaling and multi-tenant isolation.*
- [ ] Integrate OAuth2 token auth for client applications registration.
- [ ] Implement database connection pooling controls (RDS Proxy) to survive serverless scale-outs.
- [ ] Deploy Gateway, NGINX, and core Postgres DB to AWS (ECS/RDS) with Serverless Lambdas.
- [ ] Perform load test simulations (e.g. Locust or k6) to validate failover responsiveness during mock traffic spikes.
