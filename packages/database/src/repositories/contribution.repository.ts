import { PrismaClient } from "@prisma/client";
import { ContributionType, ContributionStatus } from "../../../types/src/domain/enums";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

type Contribution = any;

/**
 * Repository for Contribution entity
 * 
 * NOTE: This is a STUB implementation for Package 1/2.
 * Full contribution type system (Money, Volunteer, Goods, Equipment, Skills)
 * will be implemented in future packages as per the phased rollout plan.
 * 
 * Current schema only includes the base Contribution model.
 */
export class ContributionRepository extends BaseRepository<Contribution> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Contribution");
  }

  /**
   * Find contribution by ID
   */
  async findById(id: string): Promise<Contribution | null> {
    return this.prisma.contribution.findUnique({
      where: { id },
      include: {
        need: {
          include: {
            campaign: {
              include: {
                organization: true,
              },
            },
          },
        },
        user: true,
      },
    });
  }

  /**
   * Find contributions by need
   */
  async findByNeed(
    needId: string,
    options?: FindAllOptions
  ): Promise<Contribution[]> {
    return this.prisma.contribution.findMany({
      where: {
        needId,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
      },
    });
  }

  /**
   * Find contributions by user
   */
  async findByUser(
    userId: string,
    options?: FindAllOptions
  ): Promise<Contribution[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.contribution.findMany({
      where: {
        userId,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        need: {
          include: {
            campaign: {
              include: {
                organization: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find contributions by type
   */
  async findByType(
    contributionType: ContributionType,
    options?: FindAllOptions
  ): Promise<Contribution[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.contribution.findMany({
      where: {
        contributionType,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        need: true,
      },
    });
  }

  /**
   * Find all contributions
   */
  async findAll(options?: FindAllOptions): Promise<Contribution[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.contribution.findMany({
      where: {
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new contribution
   */
  async create(
    data: Omit<Contribution, "id" | "createdAt" | "updatedAt">
  ): Promise<Contribution> {
    return this.prisma.contribution.create({
      data,
    });
  }

  /**
   * Update contribution
   */
  async update(
    id: string,
    data: Partial<Omit<Contribution, "id" | "createdAt" | "updatedAt">>
  ): Promise<Contribution> {
    const existing = await this.prisma.contribution.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.contribution.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete contribution
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.contribution.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.contribution.delete({
      where: { id },
    });
  }

  /**
   * Soft delete contribution
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.prisma.contribution.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.contribution.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Find contributions by status
   */
  async findByStatus(
    status: ContributionStatus,
    options?: FindAllOptions
  ): Promise<Contribution[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.contribution.findMany({
      where: {
        status,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        need: true,
      },
    });
  }

  /**
   * Update contribution status
   */
  async updateStatus(
    id: string,
    status: ContributionStatus
  ): Promise<Contribution> {
    return this.update(id, { status });
  }

  /**
   * Get contribution statistics by user
   */
  async getUserContributionStats(userId: string): Promise<{
    total: number;
    byType: Record<ContributionType, number>;
    byStatus: Record<ContributionStatus, number>;
  }> {
    const contributions = await this.findByUser(userId);

    const byType = contributions.reduce((acc, c) => {
      acc[c.contributionType] = (acc[c.contributionType] || 0) + 1;
      return acc;
    }, {} as Record<ContributionType, number>);

    const byStatus = contributions.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    }, {} as Record<ContributionStatus, number>);

    return {
      total: contributions.length,
      byType,
      byStatus,
    };
  }
}