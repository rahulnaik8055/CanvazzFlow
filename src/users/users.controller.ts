import { Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { UsersService } from './users.service';
import { createClerkClient } from '@clerk/backend';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  private clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(private readonly usersService: UsersService) {}

  @Post('sync')
  async syncUser(@Req() req: Request) {
    const clerkUserId = req['userId'];

    const clerkUser = await this.clerk.users.getUser(clerkUserId);

    return this.usersService.upsertUser({
      id: clerkUser.id,
      email:
        clerkUser.emailAddresses[0]?.emailAddress ?? `user-${clerkUser.id}@placeholder.dev`,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      imageUrl: clerkUser.imageUrl,
    });
  }
}
