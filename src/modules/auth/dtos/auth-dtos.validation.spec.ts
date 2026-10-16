import { describe, it, expect } from '@jest/globals';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { LoginRequestDto } from './login-request.dto';
import { RegisterRequestDto } from './register-request.dto';

const invalidFields = async <T extends object>(
  dto: new () => T,
  plain: object,
): Promise<string[]> => {
  const errors = await validate(plainToInstance(dto, plain));
  return errors.map((error) => error.property);
};

describe('LoginRequestDto', () => {
  const valid = { email: 'ana@correo.com', password: 'x' };

  it('acepta credenciales con formato válido', async () => {
    await expect(invalidFields(LoginRequestDto, valid)).resolves.toEqual([]);
  });

  it.each(['no-es-email', '', undefined])('rechaza email=%p', async (email) => {
    await expect(
      invalidFields(LoginRequestDto, { ...valid, email }),
    ).resolves.toContain('email');
  });

  it.each(['', undefined, 123])('rechaza password=%p', async (password) => {
    await expect(
      invalidFields(LoginRequestDto, { ...valid, password }),
    ).resolves.toContain('password');
  });
});

describe('RegisterRequestDto', () => {
  const valid = {
    name: 'Ana',
    email: 'ana@correo.com',
    password: '12345678',
  };

  it('acepta un registro válido', async () => {
    await expect(invalidFields(RegisterRequestDto, valid)).resolves.toEqual([]);
  });

  it.each([
    ['', false],
    ['a'.repeat(150), true],
    ['a'.repeat(151), false],
  ])('name de %p caracteres es válido: %p', async (name, isValid) => {
    const fields = await invalidFields(RegisterRequestDto, { ...valid, name });

    expect(fields.includes('name')).toBe(!isValid);
  });

  it.each([
    ['ana@correo.com', true],
    ['no-es-email', false],
    [`${'a'.repeat(250)}@x.com`, false],
  ])('email=%p es válido: %p', async (email, isValid) => {
    const fields = await invalidFields(RegisterRequestDto, { ...valid, email });

    expect(fields.includes('email')).toBe(!isValid);
  });

  it.each([
    ['1234567', false],
    ['12345678', true],
    ['a'.repeat(128), true],
    ['a'.repeat(129), false],
  ])('password=%p es válido: %p', async (password, isValid) => {
    const fields = await invalidFields(RegisterRequestDto, {
      ...valid,
      password,
    });

    expect(fields.includes('password')).toBe(!isValid);
  });
});
