// ── Organizations ──────────────────────────────────────────────────────────
export const CREATE_ORGANIZATION = `#graphql
  mutation CreateOrganization($input: CreateOrganizationInput!) {
    createOrganization(input: $input) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ORGANIZATION = `#graphql
  mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
    updateOrganization(id: $id, input: $input) {
      id
      name
      slug
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ORGANIZATION = `#graphql
  mutation DeleteOrganization($id: ID!) {
    deleteOrganization(id: $id)
  }
`;

// ── Applications ───────────────────────────────────────────────────────────
export const CREATE_APPLICATION = `#graphql
  mutation CreateApplication($input: CreateApplicationInput!) {
    createApplication(input: $input) {
      id
      organizationId
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_APPLICATION = `#graphql
  mutation UpdateApplication($id: ID!, $input: UpdateApplicationInput!) {
    updateApplication(id: $id, input: $input) {
      id
      organizationId
      name
      description
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_APPLICATION = `#graphql
  mutation DeleteApplication($id: ID!) {
    deleteApplication(id: $id)
  }
`;

// ── GraphQL Services ───────────────────────────────────────────────────────
export const CREATE_GRAPHQL_SERVICE = `#graphql
  mutation CreateGraphQLService($input: CreateGraphQLServiceInput!) {
    createGraphQLService(input: $input) {
      id
      applicationId
      name
      endpoint
      environment
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_GRAPHQL_SERVICE = `#graphql
  mutation UpdateGraphQLService($id: ID!, $input: UpdateGraphQLServiceInput!) {
    updateGraphQLService(id: $id, input: $input) {
      id
      applicationId
      name
      endpoint
      environment
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_GRAPHQL_SERVICE = `#graphql
  mutation DeleteGraphQLService($id: ID!) {
    deleteGraphQLService(id: $id)
  }
`;

// ── Operations ─────────────────────────────────────────────────────────────
export const CREATE_OPERATION = `#graphql
  mutation CreateOperation($input: CreateOperationInput!) {
    createOperation(input: $input) {
      id
      graphQLServiceId
      name
      type
      estimatedCost
      cacheable
      requiresDatabase
      priority
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_OPERATION = `#graphql
  mutation UpdateOperation($id: ID!, $input: UpdateOperationInput!) {
    updateOperation(id: $id, input: $input) {
      id
      graphQLServiceId
      name
      type
      estimatedCost
      cacheable
      requiresDatabase
      priority
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_OPERATION = `#graphql
  mutation DeleteOperation($id: ID!) {
    deleteOperation(id: $id)
  }
`;

// ── Routing Policies ───────────────────────────────────────────────────────
export const CREATE_ROUTING_POLICY = `#graphql
  mutation CreateRoutingPolicy($input: CreateRoutingPolicyInput!) {
    createRoutingPolicy(input: $input) {
      id
      operationId
      preferredRuntime
      cpuThreshold
      requestThreshold
      enabled
      createdAt
      updatedAt
    }
  }
`;

export const UPDATE_ROUTING_POLICY = `#graphql
  mutation UpdateRoutingPolicy($id: ID!, $input: UpdateRoutingPolicyInput!) {
    updateRoutingPolicy(id: $id, input: $input) {
      id
      operationId
      preferredRuntime
      cpuThreshold
      requestThreshold
      enabled
      createdAt
      updatedAt
    }
  }
`;

export const DELETE_ROUTING_POLICY = `#graphql
  mutation DeleteRoutingPolicy($id: ID!) {
    deleteRoutingPolicy(id: $id)
  }
`;
