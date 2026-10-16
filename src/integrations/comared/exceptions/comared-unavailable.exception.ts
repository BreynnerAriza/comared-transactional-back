import { ServiceUnavailableException } from '@nestjs/common';

export class ComaredUnavailableException extends ServiceUnavailableException {
  constructor(cause?: unknown) {
    super('No fue posible autenticarse con Comared', { cause });
  }
}
