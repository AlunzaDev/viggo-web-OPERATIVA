import type { AuthRepository } from "../../../domain/repositories/auth.repository";
import type {
  AuthSession,
  LoginParams,
} from "../../../domain/datasources/auth.datasource";

export class LoginUseCase {
  private readonly repository: AuthRepository;

  constructor(repository: AuthRepository) {
    this.repository = repository;
  }

  execute(params: LoginParams): Promise<AuthSession> {
    return this.repository.login(params);
  }
}
