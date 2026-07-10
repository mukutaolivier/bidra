import { PrismaClient, AuditLog } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

/**
 * Repository for AuditLog entity
 */
export class AuditLogRepository extends BaseRepository<AuditLog> {
  constructor(prisma: PrismaClient) {
    super(prisma, "AuditLog");
  }

  /**
   * Find audit log by ID
   */
  async findById(id: string): Promise<AuditLog | null> {
    return this.prisma.auditLog.findUnique({
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
  ): Promise<AuditLog[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.auditLog.findMany({
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
  ): Promise<AuditLog[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.auditLog.findMany({
      where: { action },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find failed login attempts by IP address
   */
  async findFailedLoginsByIp(
    ipAddress: string,
    since: Date
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        action: "LOGIN",
        success: false,
        ipAddress,
        createdAt: {
          gte: since,
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find recent security events
   */
  async findRecentSecurityEvents(
    limit: number = 100
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        action: {
          in: [
            "LOGIN",
            "LOGOUT",
            "REGISTER",
            "PASSWORD_RESET",
            "EMAIL_VERIFICATION",
            "ACCOUNT_LOCKED",
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
    data: Omit<AuditLog, "id" | "createdAt">
  ): Promise<AuditLog> {
    return this.prisma.auditLog.create({
      data,
    });
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    action: string,
    userId: string | null,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    details?: Record<string, any>
  ): Promise<AuditLog> {
    return this.create({
      action,
      userId,
      success,
      ipAddress,
      userAgent,
      details: details || null,
    });
  }

  /**
   * Delete old audit logs (data retention)
   */
  async deleteOlderThan(date: Date): Promise<number> {
    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: date,
        },
      },
    });

    return result.count;
  }
}