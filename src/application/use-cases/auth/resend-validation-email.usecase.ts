import type { AuthRepository } from "../../../domain/repositories/auth.repository";
import type { ResendValidationEmailParams } from "../../../domain/datasources/auth.datasource";

export class ResendValidationEmailUseCase {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  execute(params: ResendValidationEmailParams): Promise<string> {
    return this.repository.resendValidationEmail(params);
  }
}
