import { UserEntity } from "../../../domain/entities/user.entity";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { UpdateUserDto } from "../../../infrastructure/dtos/user/update-user.dto";

export class UpdateUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(userId: string, dto: UpdateUserDto): Promise<UserEntity> {
    return this.userRepository.updateUser(userId, dto);
  }
}
