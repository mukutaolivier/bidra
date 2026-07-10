import { PrismaClient, RefreshToken } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { FindAllOptions, PaginatedResult } from "../types/repository.types";

/**
 * Repository for RefreshToken entity
 */
export class RefreshTokenRepository extends BaseRepository<RefreshToken> {
  constructor(prisma: PrismaClient) {
    super(prisma, "RefreshToken");
  }

  /**
   * Find all refresh tokens with pagination
   */
  async findAll(options?: FindAllOptions): Promise<RefreshToken[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.refreshToken.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find refresh token by ID
   */
  async findById(id: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { id },
    });
  }

  /**
   * Find refresh token by token value
   */
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find all tokens for a user
   */
  async findByUserId(
    userId: string,
    options?: FindAllOptions
  ): Promise<RefreshToken[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find active (non-revoked, non-expired) tokens for a user
   */
  async findActiveByUserId(userId: string): Promise<RefreshToken[]> {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new refresh token
   */
  async create(
    data: Omit<RefreshToken, "id" | "createdAt">
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  /**
   * Revoke refresh token
   */
  async revoke(id: string, replacedBy?: string): Promise<RefreshToken> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.refreshToken.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        replacedBy,
      },
    });
  }

  /**
   * Revoke token by token value
   */
  async revokeByToken(
    token: string,
    replacedBy?: string
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { token },
      data: {
        revokedAt: new Date(),
        replacedBy,
      },
    });
  }

  /**
   * Revoke all tokens for a user (logout everywhere)
   */
  async revokeAllForUser(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return result.count;
  }

  /**
   * Delete expired tokens (cleanup)
   */
  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  }

  /**
   * Delete all tokens for a user
   */
  async deleteAllForUser(userId: string): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return result.count;
  }

  /**
   * Update refresh token (not commonly used - tokens are typically immutable)
   */
  async update(
    id: string,
    data: Partial<RefreshToken>
  ): Promise<RefreshToken> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.refreshToken.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete refresh token
   */
  async delete(id: string): Promise<RefreshToken> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  /**
   * Soft delete not applicable for RefreshToken (no deletedAt field)
   * Tokens are revoked instead
   */
  async softDelete(id: string): Promise<RefreshToken> {
    return this.revoke(id);
  }
}