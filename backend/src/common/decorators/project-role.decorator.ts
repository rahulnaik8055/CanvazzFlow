// src/common/decorators/project-role.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { MemberRole } from 'generated/prisma/client';

export const ROLES_KEY = 'project_roles';
export const ProjectRoles = (...roles: MemberRole[]) =>
  SetMetadata(ROLES_KEY, roles);
