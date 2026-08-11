export const GET_DASHBOARD_DATA = `#graphql
  query GetDashboardData {
    executionHistory {
      id
      operationId
      runtimeChosen
      decisionReason
      cpuUsage
      memoryUsage
      cacheHit
      responseTime
      status
      createdAt
    }
    operations {
      id
      name
      type
      priority
      cacheable
      requiresDatabase
      graphQLServiceId
    }
  }
`;

export const GET_EXECUTION_HISTORY = `#graphql
  query GetExecutionHistory {
    executionHistory {
      id
      operationId
      runtimeChosen
      decisionReason
      cpuUsage
      memoryUsage
      cacheHit
      responseTime
      status
      createdAt
    }
    operations {
      id
      name
      type
    }
  }
`;

export const GET_ORGANIZATIONS_PAGE = `#graphql
  query GetOrganizationsPage {
    organizations {
      id
      name
      slug
      createdAt
      updatedAt
    }
    applications {
      id
      organizationId
    }
  }
`;

export const GET_APPLICATIONS_PAGE = `#graphql
  query GetApplicationsPage {
    applications {
      id
      organizationId
      name
      description
      createdAt
      updatedAt
    }
    organizations {
      id
      name
    }
    graphqlServices {
      id
      applicationId
    }
  }
`;

export const GET_SERVICES_PAGE = `#graphql
  query GetServicesPage {
    graphqlServices {
      id
      applicationId
      name
      endpoint
      environment
      createdAt
      updatedAt
    }
    applications {
      id
      name
    }
    operations {
      id
      graphQLServiceId
    }
  }
`;
export const GET_SERVICES = GET_SERVICES_PAGE;

export const GET_OPERATIONS_PAGE = `#graphql
  query GetOperationsPage {
    operations {
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
    graphqlServices {
      id
      name
      endpoint
    }
    routingPolicies {
      id
      operationId
      preferredRuntime
      cpuThreshold
      requestThreshold
      enabled
    }
  }
`;
export const GET_OPERATIONS = GET_OPERATIONS_PAGE;

export const GET_ROUTING_POLICIES_PAGE = `#graphql
  query GetRoutingPoliciesPage {
    routingPolicies {
      id
      operationId
      preferredRuntime
      cpuThreshold
      requestThreshold
      enabled
      createdAt
      updatedAt
    }
    operations {
      id
      name
      type
    }
  }
`;
