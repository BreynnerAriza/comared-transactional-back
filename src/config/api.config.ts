import { registerAs } from '@nestjs/config';
import { EnvUtil } from './env.util';

export default registerAs('api', () => ({
  url: EnvUtil.required('API_URL'),
  username: EnvUtil.required('API_USERNAME'),
  password: EnvUtil.required('API_PASSWORD'),
  keyName: EnvUtil.required('API_KEY_NAME'),
  keyValue: EnvUtil.required('API_KEY_VALUE'),
}));