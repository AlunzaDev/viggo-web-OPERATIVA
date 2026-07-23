import type { AuthRepository } from "../../../domain/repositories/auth.repository";
import type { ChangePasswordParams } from "../../../domain/datasources/auth.datasource";

export class ChangePasswordUseCase {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  execute(params: ChangePasswordParams): Promise<string> {
    return this.repository.changePassword(params);
  }
}
