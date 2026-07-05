export interface Application {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateApplicationInput {
  organizationId: string;
  name: string;
  description: string;
}



