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

export interface UpdateGraphQLServiceInput {
  applicationId?: string | undefined;
  name?: string | undefined;
  endpoint?: string | undefined;
  environment?: string | undefined;
}
