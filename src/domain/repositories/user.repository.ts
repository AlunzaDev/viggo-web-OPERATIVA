import { UserEntity } from "../entities/user.entity";
import { CreateUserDto } from "../../infrastructure/dtos/user/create-user.dto";
import { UpdateUserDto } from "../../infrastructure/dtos/user/update-user.dto";
import type { GetUsersParams, GetUsersResult } from "../datasources/user.datasource";

export abstract class UserRepository {
  abstract register(createUserDto: CreateUserDto): Promise<UserEntity>;
  abstract getUsers(params?: GetUsersParams): Promise<GetUsersResult>;
  abstract updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity>;
}
