import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';
import { CreateUserData } from '../interfaces/create-user.interface';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(data: CreateUserData): Promise<UserEntity> {
    const normalizedEmail = data.email.trim().toLowerCase();

    if (await this.userRepository.existsByEmail(normalizedEmail)) {
      throw new ConflictException('El correo electrónico ya está registrado');
    }

    return this.userRepository.create(
      data.name.trim(),
      normalizedEmail,
      data.passwordHash,
    );
  }

  async findByEmailWithPassword(email: string): Promise<UserEntity | null> {
    return this.userRepository.findByEmailWithPassword(
      email.trim().toLowerCase(),
    );
  }

  async findByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }
}
