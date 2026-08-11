import type { CreateOrganizationInput, UpdateOrganizationInput } from "./organization.types.js";
import type { OrganizationService } from "./organization.service.js";

interface OrganizationContext {
  organizationService: OrganizationService;
}

export const resolvers = {
  Query: {
    organizations: async (
      _parent: unknown,
      _args: unknown,
      context: OrganizationContext
    ) => {
      return context.organizationService.getOrganizations();
    },
    organization: async (
      _parent: unknown,
      { id }: { id: string },
      context: OrganizationContext
    ) => {
      return context.organizationService.getOrganizationById(id);
    },
  },
  Mutation: {
    createOrganization: async (
      _parent: unknown,
      { input }: { input: CreateOrganizationInput },
      context: OrganizationContext
    ) => {
      return context.organizationService.createOrganization(input);
    },
    updateOrganization: async (
      _parent: unknown,
      { id, input }: { id: string; input: UpdateOrganizationInput },
      context: OrganizationContext
    ) => {
      return context.organizationService.updateOrganization(id, input);
    },
    deleteOrganization: async (
      _parent: unknown,
      { id }: { id: string },
      context: OrganizationContext
    ) => {
      return context.organizationService.deleteOrganization(id);
    },
  },
};
