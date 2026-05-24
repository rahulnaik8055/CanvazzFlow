// src/gateway/gateway.module.ts
import { Global, Module } from '@nestjs/common';
import { AppGateway } from './app.gateway';

@Global() // so any service can inject AppGateway
@Module({ providers: [AppGateway], exports: [AppGateway] })
export class GatewayModule {}
