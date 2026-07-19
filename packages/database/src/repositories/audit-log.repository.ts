import { PrismaClient } from "@prisma/client";

type AuthenticationAuditLog = any;
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

/**
 * Repository for AuthenticationAuditLog entity
 */
export class AuditLogRepository extends BaseRepository<AuthenticationAuditLog> {
  constructor(prisma: PrismaClient) {
    super(prisma, "AuthenticationAuditLog");
  }

  /**
   * Find all audit logs with pagination
   */
  async findAll(options?: FindAllOptions): Promise<AuthenticationAuditLog[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.authenticationAuditLog.findMany({
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuthenticationAuditLog | null> {
    return this.prisma.authenticationAuditLog.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find audit logs by user ID
   */
  async findByUserId(
    userId: string,
    options?: FindAllOptions
  ): Promise<AuthenticationAuditLog[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.authenticationAuditLog.findMany({
      where: { userId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find audit logs by action
   */
  async findByAction(
    action: string,
    options?: FindAllOptions
  ): Promise<AuthenticationAuditLog[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.authenticationAuditLog.findMany({
      where: { action },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find audit logs by result
   */
  async findByResult(
    result: string,
    options?: FindAllOptions
  ): Promise<AuthenticationAuditLog[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.authenticationAuditLog.findMany({
      where: { result },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find recent security events
   */
  async findRecentSecurityEvents(
    limit: number = 100
  ): Promise<AuthenticationAuditLog[]> {
    return this.prisma.authenticationAuditLog.findMany({
      where: {
        action: {
          in: [
            "login",
            "logout",
            "register",
            "password_reset",
            "email_verify",
            "token_refresh",
            "account_lock",
          ],
        },
      },
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Create audit log entry
   */
  async create(
    data: Omit<AuthenticationAuditLog, "id" | "createdAt">
  ): Promise<AuthenticationAuditLog> {
    return this.prisma.authenticationAuditLog.create({
      data,
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    action: string,
    userId: string | null,
    result: "success" | "failure" | "error",
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<AuthenticationAuditLog> {
    return this.create({
      action,
      userId,
      result,
      ipAddress,
      userAgent,
      details: details || null,
    });
  }

  /**
   * Update audit log (not recommended - audit logs should be immutable)
   */
  async update(id: string, data: Partial<AuthenticationAuditLog>): Promise<AuthenticationAuditLog> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.authenticationAuditLog.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete audit log
   */
  async delete(id: string): Promise<AuthenticationAuditLog> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.authenticationAuditLog.delete({
      where: { id },
    });
  }

  /**
   * Soft delete not applicable for AuthenticationAuditLog (no deletedAt field)
   * Use hard delete or retention policy instead
   */
  async softDelete(id: string): Promise<AuthenticationAuditLog> {
    return this.delete(id);
  }

  /**
   * Delete old audit logs (data retention)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.authenticationAuditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return result.count;
  }
}