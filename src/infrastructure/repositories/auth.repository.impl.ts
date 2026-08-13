import type { AuthRepository } from "../../domain/repositories/auth.repository";
import type {
  AuthDataSource,
  AuthSession,
  ChangePasswordParams,
  ForgotPasswordParams,
  LoginParams,
  ResendValidationEmailParams,
  ResetPasswordParams,
} from "../../domain/datasources/auth.datasource";

export class AuthRepositoryImpl implements AuthRepository {
  private readonly datasource: AuthDataSource;

  constructor(datasource: AuthDataSource) {
    this.datasource = datasource;
  }

  login(params: LoginParams): Promise<AuthSession> {
    return this.datasource.login(params);
  }

  getSession(): Promise<AuthSession["user"] | null> {
    return this.datasource.getSession();
  }

  logout(): Promise<void> {
    return this.datasource.logout();
  }

  forgotPassword(params: ForgotPasswordParams): Promise<string> {
    return this.datasource.forgotPassword(params);
  }

  resendValidationEmail(params: ResendValidationEmailParams): Promise<string> {
    return this.datasource.resendValidationEmail(params);
  }

  resetPassword(params: ResetPasswordParams): Promise<string> {
    return this.datasource.resetPassword(params);
  }

  changePassword(params: ChangePasswordParams): Promise<string> {
    return this.datasource.changePassword(params);
  }

  updateBarrierBlasterHighScore(score: number): Promise<number> {
    return this.datasource.updateBarrierBlasterHighScore(score);
  }
}
