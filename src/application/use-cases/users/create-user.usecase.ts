import { UserEntity } from "../../../domain/entities/user.entity";
import { UserRepository } from "../../../domain/repositories/user.repository";
import { CreateUserDto } from "../../../infrastructure/dtos/user/create-user.dto";

export class CreateUserUseCase {
  private readonly userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(dto: CreateUserDto): Promise<UserEntity> {
    return this.userRepository.register(dto);
  }
}
