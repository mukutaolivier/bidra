import {
  PrismaClient,
  Contribution,
  ContributionType,
  ContributionStatus,
  MoneyContribution,
  VolunteerContribution,
  GoodsContribution,
  EquipmentContribution,
  SkillsContribution,
} from "@prisma/client";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

/**
 * Full contribution with all type-specific data
 */
type ContributionWithDetails = Contribution & {
  moneyContribution?: MoneyContribution | null;
  volunteerContribution?: VolunteerContribution | null;
  goodsContribution?: GoodsContribution | null;
  equipmentContribution?: EquipmentContribution | null;
  skillsContribution?: SkillsContribution | null;
};

/**
 * Repository for Contribution entity and all contribution types
 * Handles polymorphic contribution model with type-specific tables
 */
export class ContributionRepository extends BaseRepository<Contribution> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Contribution");
  }

  /**
   * Find contribution by ID with type-specific data
   */
  async findById(id: string): Promise<ContributionWithDetails | null> {
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
        moneyContribution: true,
        volunteerContribution: true,
        goodsContribution: true,
        equipmentContribution: true,
        skillsContribution: true,
      },
    });
  }

  /**
   * Find contributions by need
   */
  async findByNeed(
    needId: string,
    options?: FindAllOptions
  ): Promise<ContributionWithDetails[]> {
    return this.prisma.contribution.findMany({
      where: {
        needId,
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        moneyContribution: true,
        volunteerContribution: true,
        goodsContribution: true,
        equipmentContribution: true,
        skillsContribution: true,
      },
    });
  }

  /**
   * Find contributions by user
   */
  async findByUser(
    userId: string,
    options?: FindAllOptions
  ): Promise<ContributionWithDetails[]> {
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
        moneyContribution: true,
        volunteerContribution: true,
        goodsContribution: true,
        equipmentContribution: true,
        skillsContribution: true,
      },
    });
  }

  /**
   * Find contributions by type
   */
  async findByType(
    contributionType: ContributionType,
    options?: FindAllOptions
  ): Promise<ContributionWithDetails[]> {
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
        moneyContribution: true,
        volunteerContribution: true,
        goodsContribution: true,
        equipmentContribution: true,
        skillsContribution: true,
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
   * Note: Type-specific data must be created separately
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

  // ========================================================================
  // MONEY CONTRIBUTION METHODS
  // ========================================================================

  /**
   * Create money contribution with payment details
   */
  async createMoneyContribution(
    contributionData: Omit<Contribution, "id" | "createdAt" | "updatedAt">,
    moneyData: Omit<
      MoneyContribution,
      "id" | "contributionId" | "createdAt" | "updatedAt"
    >
  ): Promise<ContributionWithDetails> {
    return this.prisma.contribution.create({
      data: {
        ...contributionData,
        moneyContribution: {
          create: moneyData,
        },
      },
      include: {
        moneyContribution: true,
      },
    });
  }

  /**
   * Update money contribution payment status
   */
  async updateMoneyContribution(
    contributionId: string,
    data: Partial<
      Omit<MoneyContribution, "id" | "contributionId" | "createdAt" | "updatedAt">
    >
  ): Promise<MoneyContribution> {
    return this.prisma.moneyContribution.update({
      where: { contributionId },
      data,
    });
  }

  // ========================================================================
  // VOLUNTEER CONTRIBUTION METHODS
  // ========================================================================

  /**
   * Create volunteer contribution with time commitment
   */
  async createVolunteerContribution(
    contributionData: Omit<Contribution, "id" | "createdAt" | "updatedAt">,
    volunteerData: Omit<
      VolunteerContribution,
      "id" | "contributionId" | "createdAt" | "updatedAt"
    >
  ): Promise<ContributionWithDetails> {
    return this.prisma.contribution.create({
      data: {
        ...contributionData,
        volunteerContribution: {
          create: volunteerData,
        },
      },
      include: {
        volunteerContribution: true,
      },
    });
  }

  /**
   * Check-in volunteer
   */
  async checkInVolunteer(contributionId: string): Promise<VolunteerContribution> {
    return this.prisma.volunteerContribution.update({
      where: { contributionId },
      data: {
        checkedIn: true,
        checkedInAt: new Date(),
      },
    });
  }

  /**
   * Check-out volunteer
   */
  async checkOutVolunteer(contributionId: string): Promise<VolunteerContribution> {
    return this.prisma.volunteerContribution.update({
      where: { contributionId },
      data: {
        checkedOut: true,
        checkedOutAt: new Date(),
      },
    });
  }

  // ========================================================================
  // GOODS CONTRIBUTION METHODS
  // ========================================================================

  /**
   * Create goods contribution with items
   */
  async createGoodsContribution(
    contributionData: Omit<Contribution, "id" | "createdAt" | "updatedAt">,
    goodsData: Omit<
      GoodsContribution,
      "id" | "contributionId" | "createdAt" | "updatedAt"
    >
  ): Promise<ContributionWithDetails> {
    return this.prisma.contribution.create({
      data: {
        ...contributionData,
        goodsContribution: {
          create: goodsData,
        },
      },
      include: {
        goodsContribution: true,
      },
    });
  }

  /**
   * Update goods delivery status
   */
  async updateGoodsDelivery(
    contributionId: string,
    data: Partial<
      Omit<GoodsContribution, "id" | "contributionId" | "createdAt" | "updatedAt">
    >
  ): Promise<GoodsContribution> {
    return this.prisma.goodsContribution.update({
      where: { contributionId },
      data,
    });
  }

  // ========================================================================
  // EQUIPMENT CONTRIBUTION METHODS
  // ========================================================================

  /**
   * Create equipment contribution with loan details
   */
  async createEquipmentContribution(
    contributionData: Omit<Contribution, "id" | "createdAt" | "updatedAt">,
    equipmentData: Omit<
      EquipmentContribution,
      "id" | "contributionId" | "createdAt" | "updatedAt"
    >
  ): Promise<ContributionWithDetails> {
    return this.prisma.contribution.create({
      data: {
        ...contributionData,
        equipmentContribution: {
          create: equipmentData,
        },
      },
      include: {
        equipmentContribution: true,
      },
    });
  }

  /**
   * Mark equipment as returned
   */
  async returnEquipment(
    contributionId: string,
    returnNotes?: string
  ): Promise<EquipmentContribution> {
    return this.prisma.equipmentContribution.update({
      where: { contributionId },
      data: {
        returnStatus: "RETURNED",
        returnedAt: new Date(),
        returnNotes,
      },
    });
  }

  // ========================================================================
  // SKILLS CONTRIBUTION METHODS
  // ========================================================================

  /**
   * Create skills contribution
   */
  async createSkillsContribution(
    contributionData: Omit<Contribution, "id" | "createdAt" | "updatedAt">,
    skillsData: Omit<
      SkillsContribution,
      "id" | "contributionId" | "createdAt" | "updatedAt"
    >
  ): Promise<ContributionWithDetails> {
    return this.prisma.contribution.create({
      data: {
        ...contributionData,
        skillsContribution: {
          create: skillsData,
        },
      },
      include: {
        skillsContribution: true,
      },
    });
  }

  /**
   * Mark skills contribution as completed
   */
  async completeSkillsContribution(
    contributionId: string
  ): Promise<SkillsContribution> {
    return this.prisma.skillsContribution.update({
      where: { contributionId },
      data: {
        completedAt: new Date(),
      },
    });
  }

  /**
   * Add feedback to skills contribution
   */
  async addSkillsFeedback(
    contributionId: string,
    rating: number,
    comment?: string
  ): Promise<SkillsContribution> {
    return this.prisma.skillsContribution.update({
      where: { contributionId },
      data: {
        feedbackRating: rating,
        feedbackComment: comment,
      },
    });
  }
}