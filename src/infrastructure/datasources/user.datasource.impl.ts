import { type GetUsersParams, type GetUsersResult, UserDataSource } from "../../domain/datasources/user.datasource";
import { UserEntity } from "../../domain/entities/user.entity";
import { CreateUserDto } from "../dtos/user/create-user.dto";
import { UpdateUserDto } from "../dtos/user/update-user.dto";
import { api } from "../http/axios.instance";
import {
  asRecord,
  getApiErrorMessage,
} from "../http/api-contracts";
import { normalizeUserCollection, normalizeUserRecord } from "./user.contract";

export class UserDataSourceImpl implements UserDataSource {
  private extractErrorMessage(error: unknown, fallback: string): string {
    return getApiErrorMessage(error) || fallback;
  }

  async register(createUserDto: CreateUserDto): Promise<UserEntity> {
    try {
      const { data } = await api.post("/api/usuarios", createUserDto);
      return UserEntity.fromObject(normalizeUserRecord(data));
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

      const users = normalizeUserCollection(data).map((userObj) =>
        UserEntity.fromObject(userObj),
      );
      const total =
        typeof asRecord(data)?.total === "number" && Number.isFinite(asRecord(data)?.total)
          ? (asRecord(data)?.total as number)
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
        return UserEntity.fromObject(normalizeUserRecord(data));
      }

      const { data } = await api.patch(`/api/usuarios/${userId}`, updatePayload);

      if (hasStatusUpdate) {
        const statusResponse = await api.patch(`/api/usuarios/${userId}/status`, { estado });
        return UserEntity.fromObject(normalizeUserRecord(statusResponse.data));
      }

      return UserEntity.fromObject(normalizeUserRecord(data));
    } catch (error: unknown) {
      throw new Error(this.extractErrorMessage(error, "Error al actualizar el usuario"));
    }
  }
}
