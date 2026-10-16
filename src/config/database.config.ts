import { registerAs } from '@nestjs/config';
import { EnvUtil } from './env.util';

export default registerAs('database', () => ({
  host: EnvUtil.required('DB_HOST'),
  port: Number(EnvUtil.required('DB_PORT')),
  username: EnvUtil.required('DB_USERNAME'),
  password: EnvUtil.required('DB_PASSWORD'),
  database: EnvUtil.required('DB_DATABASE'),
}));