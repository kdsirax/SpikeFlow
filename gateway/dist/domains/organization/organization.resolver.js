export const resolvers = {
    Query: {
        organizations: async (_parent, _args, context) => {
            return context.organizationService.getOrganizations();
        },
        organization: async (_parent, { id }, context) => {
            return context.organizationService.getOrganizationById(id);
        },
    },
    Mutation: {
        createOrganization: async (_parent, { input }, context) => {
            return context.organizationService.createOrganization(input);
        },
    },
};
//# sourceMappingURL=organization.resolver.js.map