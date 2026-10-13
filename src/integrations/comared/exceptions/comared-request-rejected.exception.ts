export class ComaredRequestRejectedException extends Error {
  constructor(message = 'El proveedor rechazó la operación') {
    super(message);
    this.name = 'ComaredRequestRejectedException';
  }
}
