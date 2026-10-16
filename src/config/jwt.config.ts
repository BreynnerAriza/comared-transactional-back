import { registerAs } from '@nestjs/config';
import { EnvUtil } from './env.util';

export default registerAs('jwt', () => {
  const expiresIn = Number(process.env.JWT_EXPIRES_IN_SECONDS ?? 3600);

  if (!Number.isSafeInteger(expiresIn) || expiresIn <= 0) {
    throw new Error('JWT_EXPIRES_IN_SECONDS debe ser un entero positivo');
  }

  const secret = EnvUtil.required('JWT_SECRET');

  if (secret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
  }

  return {
    secret,
    expiresIn,
  };
  
});
