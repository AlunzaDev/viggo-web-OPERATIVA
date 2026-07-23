import { UserRepository } from "../../../domain/repositories/user.repository";
import type { GetUsersParams, GetUsersResult } from "../../../domain/datasources/user.datasource";

export class GetUsersUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(params?: GetUsersParams): Promise<GetUsersResult> {
    return this.userRepository.getUsers(params);
  }
}
