import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import type { ConfigType } from '@nestjs/config';
import apiConfig from '../../config/api.config';
import { ComaredAuthService } from './services/comared-auth.service';
import { ComaredClientService } from './services/comared-client.service';

@Module({
  imports: [
    HttpModule.registerAsync({
      inject: [apiConfig.KEY],
      useFactory: (config: ConfigType<typeof apiConfig>) => ({
        baseURL: config.url,
        timeout: 10_000,
      }),
    }),
  ],
  providers: [ComaredAuthService, ComaredClientService],
  exports: [ComaredClientService],
})
export class ComaredModule {}
