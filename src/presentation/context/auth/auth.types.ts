import type { AuthUserEntity } from "../../../domain/entities/auth-user.entity";

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthContextType = {
  token: string | null;
  user: AuthUserEntity | null;
  loading: boolean;
  isAuthenticated: boolean;
  sessionExpired: boolean;

  login: (payload: LoginPayload) => Promise<AuthUserEntity>;
  logout: () => Promise<void>;
};
