import { PrismaClient } from "@prisma/client";
import { NeedType, NeedStatus } from "../../../types/src/domain/enums";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

type Need = any;

/**
 * Repository for Need entity
 */
export class NeedRepository extends BaseRepository<Need> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Need");
  }

  /**
   * Find need by ID with campaign data
   */
  async findById(id: string): Promise<Need | null> {
    return this.prisma.need.findUnique({
      where: { id },
      include: {
        campaign: {
          include: {
            organization: true,
          },
        },
      },
    });
  }

  /**
   * Find needs by campaign
   */
  async findByCampaign(
    campaignId: string,
    options?: FindAllOptions
  ): Promise<Need[]> {
    return this.prisma.need.findMany({
      where: {
        campaignId,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find needs by type
   */
  async findByType(
    needType: NeedType,
    options?: FindAllOptions
  ): Promise<Need[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.need.findMany({
      where: {
        needType,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        campaign: true,
      },
    });
  }

  /**
   * Find open needs
   */
  async findOpen(options?: FindAllOptions): Promise<Need[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.need.findMany({
      where: {
        status: NeedStatus.OPEN,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { deadline: "asc" },
      include: {
        campaign: {
          include: {
            organization: true,
          },
        },
      },
    });
  }

  /**
   * Find all needs
   */
  async findAll(options?: FindAllOptions): Promise<Need[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.need.findMany({
      where: {
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new need
   */
  async create(data: Omit<Need, "id" | "createdAt" | "updatedAt">): Promise<Need> {
    return this.prisma.need.create({
      data,
    });
  }

  /**
   * Update need
   */
  async update(
    id: string,
    data: Partial<Omit<Need, "id" | "createdAt" | "updatedAt">>
  ): Promise<Need> {
    const existing = await this.prisma.need.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.need.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete need
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.need.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.need.delete({
      where: { id },
    });
  }

  /**
   * Soft delete need
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.prisma.need.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.need.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}