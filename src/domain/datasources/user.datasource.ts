import { UserEntity } from "../entities/user.entity";
import { CreateUserDto } from "../../infrastructure/dtos/user/create-user.dto";
import { UpdateUserDto } from "../../infrastructure/dtos/user/update-user.dto";

export interface GetUsersParams {
  page?: number;
  limit?: number;
}

export interface GetUsersResult {
  users: UserEntity[];
  total: number;
  page: number;
  limit: number;
}

export abstract class UserDataSource {
  abstract register(createUserDto: CreateUserDto): Promise<UserEntity>;
  abstract getUsers(params?: GetUsersParams): Promise<GetUsersResult>;
  abstract updateUser(userId: string, updateUserDto: UpdateUserDto): Promise<UserEntity>;
}
