import { type GetUsersParams, type GetUsersResult, UserDataSource } from "../../domain/datasources/user.datasource";
import { UserEntity } from "../../domain/entities/user.entity";
import { CreateUserDto } from "../dtos/user/create-user.dto";
import { UpdateUserDto } from "../dtos/user/update-user.dto";
import { api } from "../http/axios.instance";

type ApiErrorPayload = {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
  };
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const resolveUserPayload = (data: unknown): Record<string, unknown> => {
  if (isRecord(data)) {
    const userPayload = data.usuario ?? data.user;
    if (isRecord(userPayload)) {
      return userPayload;
    }
    return data;
  }

  throw new Error("Respuesta de usuario invalida");
};

export class UserDataSourceImpl implements UserDataSource {
  private extractErrorMessage(error: unknown, fallback: string): string {
    if (!isRecord(error)) return fallback;
    const parsedError = error as ApiErrorPayload;
    return parsedError.response?.data?.message || parsedError.response?.data?.error || fallback;
  }

  async register(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      const { data } = await api.post("/api/usuarios", createUserDto);
      return UserEntity.fromObject(resolveUserPayload(data));
    } catch (error: unknown) {
      throw new Error(this.extractErrorMessage(error, "Error al crear el usuario"));
    }
  }

  async getUsers(params: GetUsersParams = {}): Promise<GetUsersResult> {
    try {
      const page = Math.max(1, Number(params.page) || 1);
      const limit = Math.min(Math.max(1, Number(params.limit) || 10), 200);
      const desde = (page - 1) * limit;

      const { data } = await api.get("/api/usuarios", {
        params: {
          desde,
          limite: limit,
        },
      });

      const usersList =
        Array.isArray(data)
          ? data
          : (isRecord(data) && Array.isArray(data.usuarios) ? data.usuarios : []);

      const users = usersList.map((userObj) => UserEntity.fromObject(resolveUserPayload(userObj)));
      const total =
        isRecord(data) && typeof data.total === "number" && Number.isFinite(data.total)
          ? data.total
          : users.length;

      return { users, total, page, limit };
    } catch (error: unknown) {
      const errorMessage = this.extractErrorMessage(error, "Error al obtener la lista de usuarios");
      throw new Error(errorMessage);
    }
  }

  async updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    try {
      const { estado, ...rest } = updateUserDto;
      const updatePayload = Object.fromEntries(
        Object.entries(rest).filter(([, value]) => value !== undefined)
      );
      const hasStatusUpdate = typeof estado === "boolean";
      const hasUserUpdate = Object.keys(updatePayload).length > 0;

      if (hasStatusUpdate && !hasUserUpdate) {
        const { data } = await api.patch(`/api/usuarios/${userId}/status`, { estado });
        return UserEntity.fromObject(resolveUserPayload(data));
      }

      const { data } = await api.patch(`/api/usuarios/${userId}`, updatePayload);

      if (hasStatusUpdate) {
        const statusResponse = await api.patch(`/api/usuarios/${userId}/status`, { estado });
        return UserEntity.fromObject(resolveUserPayload(statusResponse.data));
      }

      return UserEntity.fromObject(resolveUserPayload(data));
    } catch (error: unknown) {
      throw new Error(this.extractErrorMessage(error, "Error al actualizar el usuario"));
    }
  }
}
