export interface GraphQLService {
  id: string;
  applicationId: string;
  name: string;
  endpoint: string;
  environment: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGraphQLServiceInput {
  applicationId: string;
  name: string;
  endpoint: string;
  environment: string;
}
