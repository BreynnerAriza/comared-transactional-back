import type { AuthenticatedUser } from './authenticated-user.interface';

/** Datos públicos del usuario en el login: no expone el identificador interno. */
export type LoginUser = Omit<AuthenticatedUser, 'id'>;

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  user: LoginUser;
}
