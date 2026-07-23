import type { AuthRepository } from "../../../domain/repositories/auth.repository";
import type { ResetPasswordParams } from "../../../domain/datasources/auth.datasource";

export class ResetPasswordUseCase {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  execute(params: ResetPasswordParams): Promise<string> {
    return this.repository.resetPassword(params);
  }
}
