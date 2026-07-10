import { PrismaClient, User, UserRole, UserStatus } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

/**
 * Repository for User entity
 */
export class UserRepository extends BaseRepository<User> {
  constructor(prisma: PrismaClient) {
    super(prisma, "User");
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole, options?: FindAllOptions): Promise<User[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.user.findMany({
      where: {
        role,
        deletedAt: options?.includeDeleted ? undefined : null,
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
  async findAll(options?: FindAllOptions): Promise<User[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.user.findMany({
      where: {
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new user
   */
  async create(data: Omit<User, "id" | "createdAt" | "updatedAt">): Promise<User> {
    return this.prisma.user.create({
      data,
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
    });
  }
}