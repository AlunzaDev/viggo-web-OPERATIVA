import { ForgotPasswordUseCase } from "../../../application/use-cases/auth/forgot-password.usecase";
import { ResendValidationEmailUseCase } from "../../../application/use-cases/auth/resend-validation-email.usecase";
import { ResetPasswordUseCase } from "../../../application/use-cases/auth/reset-password.usecase";
import { AuthDataSourceImpl } from "../../../infrastructure/datasources/auth.datasource.impl";
import { AuthRepositoryImpl } from "../../../infrastructure/repositories/auth.repository.impl";

const authDatasource = new AuthDataSourceImpl();
const authRepository = new AuthRepositoryImpl(authDatasource);

const forgotPasswordUseCase = new ForgotPasswordUseCase(authRepository);
const resendValidationEmailUseCase = new ResendValidationEmailUseCase(authRepository);
const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

export const requestPasswordReset = (email: string) =>
  forgotPasswordUseCase.execute({ email });

export const resendValidationEmail = (email: string) =>
  resendValidationEmailUseCase.execute({ email });

export const resetPassword = (token: string, newPassword: string) =>
  resetPasswordUseCase.execute({ token, newPassword });

