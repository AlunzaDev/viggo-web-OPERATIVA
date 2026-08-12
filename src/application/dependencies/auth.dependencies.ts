import { ForgotPasswordUseCase } from "../use-cases/auth/forgot-password.usecase";
import { LoginUseCase } from "../use-cases/auth/login.usecase";
import { ResendValidationEmailUseCase } from "../use-cases/auth/resend-validation-email.usecase";
import { ResetPasswordUseCase } from "../use-cases/auth/reset-password.usecase";
import { AuthDataSourceImpl } from "../../infrastructure/datasources/auth.datasource.impl";
import { setSessionTokenMarker } from "../../infrastructure/http/axios.instance";
import { AuthRepositoryImpl } from "../../infrastructure/repositories/auth.repository.impl";

const authDatasource = new AuthDataSourceImpl();
export const authRepository = new AuthRepositoryImpl(authDatasource);

export const loginUseCase = new LoginUseCase(authRepository);
export const forgotPasswordUseCase = new ForgotPasswordUseCase(authRepository);
export const resendValidationEmailUseCase = new ResendValidationEmailUseCase(authRepository);
export const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

export const markSessionToken = (token: string | null): void => {
  setSessionTokenMarker(token);
};