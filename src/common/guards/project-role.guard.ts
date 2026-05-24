// src/common/guards/project-role.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ROLES_KEY } from '../decorators/project-role.decorator';
import { MemberRole } from 'generated/prisma/enums';
import { PrismaService } from 'src/prisma/prisma.service';

const HIERARCHY: Record<MemberRole, number> = {
  owner: 3,
  editor: 2,
  viewer: 1,
};

@Injectable()
export class ProjectRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required?.length) return true;

    const req = ctx.switchToHttp().getRequest();
    const userId: string = req.user?.id;
    const projectId: string = req.params.projectId ?? req.body?.projectId;

    if (!userId || !projectId) {
      throw new ForbiddenException('Missing auth or project context');
    }

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) throw new NotFoundException('Project not found');
    if (project.ownerId === userId) {
      req.projectRole = 'owner';
      return true;
    }

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });
    if (!member) throw new ForbiddenException('Not a member of this project');

    const userLevel = HIERARCHY[member.role];
    const minRequired = Math.min(...required.map((r) => HIERARCHY[r]));

    if (userLevel < minRequired) {
      throw new ForbiddenException(
        `Requires at least ${required.join(' or ')} role`,
      );
    }

    req.projectRole = member.role;
    return true;
  }
}
