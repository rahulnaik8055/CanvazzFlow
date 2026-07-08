import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvitationsService } from '../invitations/invitations.service';
import { AccessRequestsService } from '../access-requests/access-requests.service';

@Injectable()
export class AccessService {
  constructor(
    private prisma: PrismaService,
    private invitations: InvitationsService,
    private accessRequests: AccessRequestsService,
  ) {}

  async getIncoming(userId: string) {
    const [receivedInvitations, pendingRequests] = await Promise.all([
      this.invitations.listMyPending(userId),
      this.accessRequests.getAllPendingForOwner(userId),
    ]);

    const incoming: any[] = [];

    for (const inv of receivedInvitations) {
      incoming.push({
        id: inv.id,
        type: 'invitation',
        projectId: inv.projectId,
        projectName: inv.project?.name,
        senderId: inv.invitedById,
        senderName: inv.invitedBy
          ? [inv.invitedBy.firstName, inv.invitedBy.lastName].filter(Boolean).join(' ') || inv.invitedBy.email
          : null,
        senderImage: inv.invitedBy?.imageUrl,
        receiverId: userId,
        role: inv.role,
        status: inv.status,
        message: inv.message,
        token: inv.token,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      });
    }

    for (const req of pendingRequests) {
      incoming.push({
        id: req.id,
        type: 'access_request',
        projectId: req.projectId,
        projectName: req.project?.name,
        senderId: req.userId,
        senderName: [req.user.firstName, req.user.lastName].filter(Boolean).join(' ') || req.user.email,
        senderImage: req.user.imageUrl,
        receiverId: userId,
        role: req.requestedRole || 'editor',
        status: req.status,
        message: req.message,
        createdAt: req.createdAt,
      });
    }

    incoming.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return incoming;
  }

  async getOutgoing(userId: string) {
    const [sentInvitations, myRequests] = await Promise.all([
      this.invitations.listSentInvitations(userId),
      this.accessRequests.myRequests(userId),
    ]);

    const outgoing: any[] = [];

    for (const inv of sentInvitations) {
      outgoing.push({
        id: inv.id,
        type: 'invitation',
        projectId: inv.projectId,
        projectName: inv.project?.name,
        receiverId: inv.userId,
        receiverName: inv.user
          ? [inv.user.firstName, inv.user.lastName].filter(Boolean).join(' ') || inv.user.email
          : inv.email || 'Link invite',
        receiverImage: inv.user?.imageUrl,
        role: inv.role,
        status: inv.status,
        message: inv.message,
        token: inv.token,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      });
    }

    for (const req of myRequests) {
      outgoing.push({
        id: req.id,
        type: 'access_request',
        projectId: req.projectId,
        projectName: req.project?.name,
        receiverId: null,
        receiverName: null,
        role: req.requestedRole || 'editor',
        status: req.status,
        message: req.message,
        createdAt: req.createdAt,
      });
    }

    outgoing.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return outgoing;
  }

  async getHistory(userId: string, filter?: string) {
    const [allInvitations, allRequests] = await Promise.all([
      this.invitations.listSentInvitations(userId),
      this.accessRequests.myRequests(userId),
    ]);

    const history: any[] = [];

    const terminalStatuses = ['accepted', 'declined', 'cancelled', 'expired'];

    for (const inv of allInvitations) {
      if (terminalStatuses.includes(inv.status)) {
        if (filter && inv.status !== filter) continue;
        history.push({
          id: inv.id,
          type: 'invitation',
          projectId: inv.projectId,
          projectName: inv.project?.name,
          receiverId: inv.userId,
          receiverName: inv.user
            ? [inv.user.firstName, inv.user.lastName].filter(Boolean).join(' ') || inv.user.email
            : inv.email || 'Link invite',
          receiverImage: inv.user?.imageUrl,
          role: inv.role,
          status: inv.status,
          message: inv.message,
          createdAt: inv.createdAt,
        });
      }
    }

    for (const req of allRequests) {
      if (terminalStatuses.includes(req.status)) {
        if (filter && req.status !== filter) continue;
        history.push({
          id: req.id,
          type: 'access_request',
          projectId: req.projectId,
          projectName: req.project?.name,
          receiverId: null,
          receiverName: null,
          role: req.requestedRole || 'editor',
          status: req.status,
          message: req.message,
          createdAt: req.createdAt,
        });
      }
    }

    history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return history;
  }

  async getBadgeCount(userId: string) {
    const [invitations, requests] = await Promise.all([
      this.prisma.projectInvitation.count({
        where: {
          OR: [
            { userId, status: 'pending', expiresAt: { gt: new Date() } },
            {
              email: (await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } }))?.email ?? '',
              status: 'pending',
              expiresAt: { gt: new Date() },
            },
          ],
        },
      }),
      this.prisma.accessRequest.count({
        where: { project: { ownerId: userId }, status: 'pending' },
      }),
    ]);

    return { count: invitations + requests };
  }
}
