import type { CreateApplicationInput } from "./application.types.js";
import type { ApplicationService } from "./application.service.js";

interface ApplicationContext {
  applicationService: ApplicationService;
}

export const resolvers = {
  Query: {
    applications: async (
      _parent: unknown,
      _args: unknown,
      context: ApplicationContext
    ) => {
      return context.applicationService.getApplications();
    },
    application: async (
      _parent: unknown,
      { id }: { id: string },
      context: ApplicationContext
    ) => {
      return context.applicationService.getApplicationById(id);
    },
  },
  Mutation: {
    createApplication: async (
      _parent: unknown,
      { input }: { input: CreateApplicationInput },
      context: ApplicationContext
    ) => {
      return context.applicationService.createApplication(input);
    },
  },
};
