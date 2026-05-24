// src/auth/clerk.guard.ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { verifyToken } from '@clerk/backend';
import { Request } from 'express';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Try Authorization header first, fall back to __session cookie
    // Liveblocks auth sends credentials: "include" (cookies) but no header
    const token =
      request.headers.authorization?.split(' ')[1] ??
      request.cookies?.['__session'];

    if (!token) throw new UnauthorizedException('No token provided');

    try {
      const payload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });

      request['userId'] = payload.sub;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
