import type { AuthRepository } from "../../../domain/repositories/auth.repository";
import type { ForgotPasswordParams } from "../../../domain/datasources/auth.datasource";

export class ForgotPasswordUseCase {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  execute(params: ForgotPasswordParams): Promise<string> {
    return this.repository.forgotPassword(params);
  }
}
