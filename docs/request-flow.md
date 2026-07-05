Browser

↓

Express Server

↓

Apollo GraphQL Server

↓

Resolver

↓

Service

↓

Response



Organization
      │
      ▼
Application
      │
      ▼
GraphQL Service
      │
      ▼
Operation Metadata
      │
      ▼
Routing Policy


Resolver

↓

Service(CreateOrganizationInput)

↓

Generate ID

↓

Generate timestamps

↓

Create Organization object

↓

Repository(Organization)

↓

Store it


## Our definition of MVP

By the end, I want to demonstrate this flow:

Client
   ↓
GraphQL Mutation
   ↓
Organization Created

↓

Application Created

↓

GraphQL Service Registered

↓

Operation Registered

↓

Routing Policy Added

↓

Incoming Request

↓

Decision Engine

↓

Docker OR Serverless