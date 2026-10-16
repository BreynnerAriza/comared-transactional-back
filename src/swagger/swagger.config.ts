import { INestApplication } from '@nestjs/common';
import {
  DocumentBuilder,
  SwaggerModule,
} from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Comared Transactional API')
    .setDescription(
      'API REST para autenticación de usuarios, consulta de proveedores, ' +
      'compra de recargas e historial de transacciones. ' +
      'Integración externa con PuntoRed.',
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Autenticación y usuarios')
    .addTag('Recharge', 'Recargas y transacciones')
    .addTag('Supplier', 'Proveedores moviles')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT obtenido mediante POST /auth/login',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });
}