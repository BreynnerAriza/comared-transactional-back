export class EnvUtil {
  static required(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
    }

    return value;
  }

}