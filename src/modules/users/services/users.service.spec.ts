import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ConflictException, NotFoundException } from '@nestjs/common';

import { UsersService } from './users.service';
import { UserRepository } from '../repositories/user.repository';
import { UserEntity } from '../entities/user.entity';

describe('UsersService', () => {
  const userRepository = {
    create: jest.fn<UserRepository['create']>(),
    existsByEmail: jest.fn<UserRepository['existsByEmail']>(),
    findByEmailWithPassword: jest.fn<UserRepository['findByEmailWithPassword']>(),
    findById: jest.fn<UserRepository['findById']>(),
  };

  const user = Object.assign(new UserEntity(), {
    id: 'u1',
    name: 'Ana',
    email: 'ana@correo.com',
  });

  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(userRepository as unknown as UserRepository);
  });

  describe('create', () => {
    it('normaliza el email y el nombre antes de guardar', async () => {
      userRepository.existsByEmail.mockResolvedValue(false);
      userRepository.create.mockResolvedValue(user);

      const result = await service.create({
        name: '  Ana  ',
        email: '  ANA@Correo.COM ',
        passwordHash: 'hash',
      });

      expect(userRepository.existsByEmail).toHaveBeenCalledWith('ana@correo.com');
      expect(userRepository.create).toHaveBeenCalledWith(
        'Ana',
        'ana@correo.com',
        'hash',
      );
      expect(result).toBe(user);
    });

    it('lanza ConflictException si el email ya está registrado', async () => {
      userRepository.existsByEmail.mockResolvedValue(true);

      await expect(
        service.create({
          name: 'Ana',
          email: 'ana@correo.com',
          passwordHash: 'hash',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(userRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findByEmailWithPassword', () => {
    it('busca con el email normalizado', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(user);

      const result = await service.findByEmailWithPassword(' ANA@correo.com ');

      expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith(
        'ana@correo.com',
      );
      expect(result).toBe(user);
    });

    it('devuelve null si el usuario no existe', async () => {
      userRepository.findByEmailWithPassword.mockResolvedValue(null);

      await expect(
        service.findByEmailWithPassword('nadie@correo.com'),
      ).resolves.toBeNull();
    });
  });

  describe('findByIdOrThrow', () => {
    it('devuelve el usuario si existe', async () => {
      userRepository.findById.mockResolvedValue(user);

      await expect(service.findByIdOrThrow('u1')).resolves.toBe(user);
      expect(userRepository.findById).toHaveBeenCalledWith('u1');
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(service.findByIdOrThrow('u1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
