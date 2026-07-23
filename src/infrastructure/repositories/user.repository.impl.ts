import { UserDataSource } from "../../domain/datasources/user.datasource";
import { UserEntity } from "../../domain/entities/user.entity";
import { UserRepository } from "../../domain/repositories/user.repository";
import { CreateUserDto } from "../dtos/user/create-user.dto";
import { UpdateUserDto } from "../dtos/user/update-user.dto";
import type { GetUsersParams, GetUsersResult } from "../../domain/datasources/user.datasource";

export class UserRepositoryImpl implements UserRepository {
  private readonly datasource: UserDataSource;

  constructor(datasource: UserDataSource) {
    this.datasource = datasource;
  }

  register(createUserDto: CreateUserDto): Promise<UserEntity> {
    return this.datasource.register(createUserDto);
  }

  getUsers(params?: GetUsersParams): Promise<GetUsersResult> {
    return this.datasource.getUsers(params);
  }

  updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    return this.datasource.updateUser(userId, updateUserDto);
  }
}
