import { PrismaClient, Campaign, CampaignStatus } from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

/**
 * Repository for Campaign entity
 */
export class CampaignRepository extends BaseRepository<Campaign> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Campaign");
  }

  /**
   * Find campaign by ID with relations
   */
  async findById(id: string): Promise<Campaign | null> {
    return this.prisma.campaign.findUnique({
      where: { id },
      include: {
        organization: true,
        needs: true,
      },
    });
  }

  /**
   * Find campaigns by organization
   */
  async findByOrganization(
    organizationId: string,
    options?: FindAllOptions
  ): Promise<Campaign[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.campaign.findMany({
      where: {
        organizationId,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        needs: true,
      },
    });
  }

  /**
   * Find active campaigns
   */
  async findActive(options?: FindAllOptions): Promise<Campaign[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.campaign.findMany({
      where: {
        status: CampaignStatus.ACTIVE,
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { startDate: "desc" },
      include: {
        organization: true,
        needs: true,
      },
    });
  }

  /**
   * Find campaigns by status
   */
  async findByStatus(
    status: CampaignStatus,
    options?: FindAllOptions
  ): Promise<Campaign[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.campaign.findMany({
      where: {
        status,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Search campaigns by title or description
   */
  async search(
    query: string,
    options?: FindAllOptions
  ): Promise<Campaign[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.campaign.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        deletedAt: null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        organization: true,
      },
    });
  }

  /**
   * Find all campaigns
   */
  async findAll(options?: FindAllOptions): Promise<Campaign[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.campaign.findMany({
      where: {
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new campaign
   */
  async create(data: Omit<Campaign, "id" | "createdAt" | "updatedAt">): Promise<Campaign> {
    return this.prisma.campaign.create({
      data,
    });
  }

  /**
   * Update campaign
   */
  async update(
    id: string,
    data: Partial<Omit<Campaign, "id" | "createdAt" | "updatedAt">>
  ): Promise<Campaign> {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.campaign.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete campaign
   */
  async delete(id: string): Promise<void> {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.campaign.delete({
      where: { id },
    });
  }

  /**
   * Soft delete campaign
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.prisma.campaign.findUnique({
      where: { id },
    });
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}