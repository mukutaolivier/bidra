import { PrismaClient } from "@prisma/client";
import { UserStatus } from "../../../types/src/domain/enums";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

type User = any;

/**
 * Repository for User entity
 */
export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma, "User");
  }

  /**
   * Find user by ID with roles
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Find user by email verification token
   */
  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });
  }

  /**
   * Find user by password reset token
   */
  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { passwordResetToken: token },
    });
  }

  /**
   * Find users by role name
   */
  async findByRoleName(roleName: string, options?: FindAllOptions): Promise<User[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.user.findMany({
      where: {
        roles: {
          some: {
            role: {
              name: roleName,
            },
          },
        },
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find active users
   */
  async findActive(options?: FindAllOptions): Promise<User[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all users
   */
  async findAll(options?: FindAllOptions): Promise<any> {
    const { pagination, where, includeDeleted } = this.normalizeOptions(options);
    const { skip, take } = this.applyPagination(pagination);

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          deletedAt: includeDeleted ? undefined : null,
          ...(where || {}),
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({
        where: {
          deletedAt: includeDeleted ? undefined : null,
          ...(where || {}),
        },
      }),
    ]);

    return this.createPaginatedResult(users, total, pagination);
  }

  /**
   * Create new user
   */
  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return this.prisma.user.create({
      data,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Update user
   */
  async update(
    id: string,
    data: Partial<Omit<User, "id" | "email" | "createdAt" | "updatedAt">>
  ): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Hard delete user
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Soft delete user
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Update user status
   */
  async updateStatus(id: string, status: UserStatus): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.user.update({
      where: { id },
      data: { status },
      include: {
        roles: {
          include: {
            role: true,
          },
        },
      },
    });
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, assignedBy?: string): Promise<void> {
    await this.prisma.userRole.create({
      data: {
        userId,
        roleId,
        assignedBy,
      },
    });
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    await this.prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  }
}