import type {
  AuthSession,
  ChangePasswordParams,
  ForgotPasswordParams,
  LoginParams,
  ResendValidationEmailParams,
  ResetPasswordParams,
} from "../datasources/auth.datasource";

export interface AuthRepository {
  login(params: LoginParams): Promise<AuthSession>;
  getSession(): Promise<AuthSession["user"] | null>;
  logout(): Promise<void>;
  forgotPassword(params: ForgotPasswordParams): Promise<string>;
  resendValidationEmail(params: ResendValidationEmailParams): Promise<string>;
  resetPassword(params: ResetPasswordParams): Promise<string>;
  changePassword(params: ChangePasswordParams): Promise<string>;
}
