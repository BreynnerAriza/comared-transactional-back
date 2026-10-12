// Lectura de variables de entorno compartida por todos los archivos de
// configuración (api, base de datos, etc.).
export class EnvUtil {
  // Devuelve la variable o lanza un error al arrancar si no está definida,
  // para fallar de inmediato en vez de con un valor undefined en tiempo de ejecución.
  static required(name: string): string {
    const value = process.env[name];

    if (!value) {
      throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
    }

    return value;
  }

}