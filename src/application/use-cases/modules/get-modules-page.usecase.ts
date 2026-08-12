import type {
  PaginatedModuleResult,
  PaginationParams,
} from "../../../domain/datasources/module.datasource";
import { ModuleRepository } from "../../../domain/repositories/module.repository";

export class GetModulesPage {
  private readonly repository: ModuleRepository;

  constructor(repository: ModuleRepository) {
    this.repository = repository;
  }

  execute(params: PaginationParams & { projectId?: string }): Promise<PaginatedModuleResult> {
    return this.repository.getPage(params);
  }
}