import { PrismaClient } from "@prisma/client";

export class UserSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    return this.prisma.userSession.findUnique({
      where: { id },
      include: {
        refreshToken: true,
        user: true,
      },
    });
  }

  async findActiveByUserId(userId: string, options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    return this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        refreshToken: true,
      },
      skip,
      take: limit,
      orderBy: { lastActivityAt: "desc" },
    });
  }

  async revoke(id: string, reason = "user_logout") {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`UserSession ${id} not found`);
    }

    return this.prisma.userSession.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async revokeAllExcept(userId: string, sessionId: string, reason = "user_logout") {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        id: {
          not: sessionId,
        },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    return result.count;
  }

  async revokeAllForUser(userId: string, reason = "logout") {
    const result = await this.prisma.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });

    return result.count;
  }
}