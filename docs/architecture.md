1. Problem Statement

Modern REST APIs face multiple challenges in real-world production systems:

Multiple endpoints lead to over-fetching and under-fetching of data.

Sudden traffic spikes can overload backend services.

Scaling all services all the time is costly and inefficient.

Traditional APIs lack visibility into how requests are processed internally.

This project aims to solve these problems by designing an adaptive backend platform that intelligently routes requests based on their nature and load characteristics. 


2. Project Overview

SpikeFlow is a developer-focused backend platform built around a GraphQL API gateway.

Instead of treating all requests equally, the platform:

Routes stable, stateful operations to containerized services.

Routes burst-heavy or compute-intensive operations to serverless functions.

Uses a reverse proxy to control traffic, rate limits, and routing behavior.

The system provides a frontend dashboard to visualize API usage, routing decisions, and system performance.

3. High-Level Architecture
Client (Web / API Consumer)
        ↓
     NGINX
 (Rate limiting, caching,
  traffic routing)
        ↓
 GraphQL Gateway
 (Single API entry point)
        ↓
 ┌────────────────────────────┐
 │                            │
 │   Core Services (Docker)   │
 │   - Users                  │
 │   - Products               │
 │   - Orders                 │
 │                            │
 │   Persistent Database      │
 │                            │
 └────────────────────────────┘
                │
                ↓
        Serverless Functions
 (Search, analytics, burst ops)

4. Key Architectural Decisions
4.1 GraphQL as API Gateway

GraphQL is used instead of REST to:

Provide a single API endpoint.

Allow clients to request only the required data.

Enable operation-level routing, which is difficult with REST APIs.

The GraphQL gateway acts as the central control point of the system.
4.2 Hybrid Container + Serverless Model

The platform uses a hybrid execution model:

Containerized services handle stable, stateful operations that require persistent data.

Serverless functions handle burst-heavy, compute-focused operations that benefit from auto-scaling.

This approach improves both scalability and cost efficiency.

4.3 Role of NGINX

NGINX acts as the system’s traffic control layer:

Enforces rate limiting to protect backend services.

Routes traffic based on GraphQL operation patterns.

Provides caching where applicable.

This keeps backend services simple and focused on business logic.

5. System Goals

High availability under traffic spikes.

Clear separation between stateful and stateless workloads.

Cost-efficient scaling strategy.

High visibility into request routing and performance.

6. Out of Scope (Initial Phase)

To maintain focus, the following are intentionally excluded from the first version:

Authentication and authorization

Kubernetes orchestration

CI/CD pipelines

Advanced UI features

These can be added in later iterations.

7. Success Criteria

The project is considered successful if:

The GraphQL API can handle mixed workloads.

Serverless functions are triggered only for appropriate operations.

Traffic routing decisions are observable via the dashboard.

The system remains stable during simulated load spikes.

8. Learning Objectives

Through this project, the following skills are developed:

System design and architectural thinking.

Practical GraphQL usage beyond CRUD APIs.

Effective use of Docker and serverless together.

Understanding traffic management with NGINX.

9. Summary

PulseAPI demonstrates how modern backend systems can move beyond traditional REST APIs by combining GraphQL, containers, serverless functions, and intelligent traffic control to build adaptive, scalable platforms.