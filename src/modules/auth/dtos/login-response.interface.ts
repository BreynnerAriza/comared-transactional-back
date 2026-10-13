import type { AuthenticatedUser } from './authenticated-user.interface';

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: AuthenticatedUser;
}
