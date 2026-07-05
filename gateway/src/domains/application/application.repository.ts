import type { Application } from "./application.types.js";

export interface IApplicationRepository {
  create(application: Application): Promise<Application>;
  findAll(): Promise<Application[]>;
  findById(id: string): Promise<Application | undefined>;
}

export class MemoryApplicationRepository implements IApplicationRepository {
  private applications: Application[] = [];

  async create(application: Application): Promise<Application> {
    this.applications.push(application);
    return application;
  }

  async findAll(): Promise<Application[]> {
    return this.applications;
  }

  async findById(id: string): Promise<Application | undefined> {
    return this.applications.find((app) => app.id === id);
  }
}
