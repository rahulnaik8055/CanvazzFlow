import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Req,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Request } from 'express';
import { ClerkAuthGuard } from '../auth/clerk.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePrivacyDto } from './dto/update-privacy.dto';
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

  @Get('me')
  async getMyProfile(@Req() req: Request) {
    const profile = await this.usersService.getProfile(req['userId']);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  @Get('profile/:id')
  async getPublicProfile(@Req() req: Request, @Param('id') id: string) {
    const viewerId = req['userId'];
    const profile = await this.usersService.getPublicProfile(id, viewerId);
    if (!profile) throw new NotFoundException('User not found');
    return profile;
  }

  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    try {
      return await this.usersService.updateProfile(req['userId'], dto);
    } catch (err: any) {
      if (err.message === 'Username already taken') {
        throw new ConflictException('Username already taken');
      }
      throw new BadRequestException(err.message);
    }
  }

  @Patch('me/privacy')
  async updatePrivacy(@Req() req: Request, @Body() dto: UpdatePrivacyDto) {
    return this.usersService.updatePrivacy(req['userId'], dto);
  }

  @Post('me/online')
  async setOnline(@Req() req: Request, @Body() body: { isOnline: boolean }) {
    return this.usersService.updateOnlineStatus(req['userId'], body.isOnline);
  }

  @Post('me/active')
  async touchActive(@Req() req: Request) {
    return this.usersService.touchLastActive(req['userId']);
  }

  @Get('me/projects/owned')
  async getOwnedProjects(@Req() req: Request) {
    const projects = await this.usersService.getOwnedProjects(req['userId']);
    return projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      thumbnail: p.thumbnail,
      visibility: p.visibility,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      owner: p.User,
      memberCount: p._count.members,
      pagesCount: p._count.pages,
      role: 'owner',
    }));
  }

  @Get('me/projects/shared')
  async getSharedProjects(@Req() req: Request) {
    const projects = await this.usersService.getSharedProjects(req['userId']);
    return projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      thumbnail: p.thumbnail,
      visibility: p.visibility,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      owner: p.User,
      memberCount: p._count.members,
      pagesCount: p._count.pages,
      role: p.myRole,
      joinedAt: p.joinedAt,
    }));
  }

  @Get('me/activity')
  async getActivity(@Req() req: Request) {
    return this.usersService.getActivity(req['userId']);
  }

  @Get('check-username/:username')
  async checkUsername(@Param('username') username: string) {
    const available = await this.usersService.isUsernameAvailable(username);
    return { available };
  }
}
