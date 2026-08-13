import type { AuthUserEntity } from "../entities/auth-user.entity";

export interface LoginParams {
  email: string;
  password: string;
}

export interface ForgotPasswordParams {
  email: string;
}

export interface ResendValidationEmailParams {
  email: string;
}

export interface ResetPasswordParams {
  token: string;
  newPassword: string;
}

export interface ChangePasswordParams {
  currentPassword: string;
  newPassword: string;
}

export interface AuthSession {
  token: string;
  user: AuthUserEntity;
}

export interface AuthDataSource {
  login(params: LoginParams): Promise<AuthSession>;
  getSession(): Promise<AuthUserEntity | null>;
  logout(): Promise<void>;
  forgotPassword(params: ForgotPasswordParams): Promise<string>;
  resendValidationEmail(params: ResendValidationEmailParams): Promise<string>;
  resetPassword(params: ResetPasswordParams): Promise<string>;
  changePassword(params: ChangePasswordParams): Promise<string>;
  updateBarrierBlasterHighScore(score: number): Promise<number>;
}
