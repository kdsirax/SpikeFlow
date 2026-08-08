export const resolvers = {
    Query: {
        applications: async (_parent, _args, context) => {
            return context.applicationService.getApplications();
        },
        application: async (_parent, { id }, context) => {
            return context.applicationService.getApplicationById(id);
        },
    },
    Mutation: {
        createApplication: async (_parent, { input }, context) => {
            return context.applicationService.createApplication(input);
        },
    },
};
//# sourceMappingURL=application.resolver.js.map