import { registerAs } from '@nestjs/config';
import { EnvUtil } from './env.util';

export default registerAs('cors', () => ({
  origins: EnvUtil.required('CORS_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
}));
