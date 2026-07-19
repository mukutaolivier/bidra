import { PrismaClient } from "@prisma/client";
import { VerificationStatus } from "../../../types/src/domain/enums";
import { BaseRepository } from "./base.repository";
import { FindAllOptions } from "../types/repository.types";

type Organization = any;

/**
 * Repository for Organization entity
 */
export class OrganizationRepository extends BaseRepository<Organization> {
  constructor(prisma: PrismaClient) {
    super(prisma, "Organization");
  }

  /**
   * Find organization by ID
   */
  async findById(id: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Find organization by organization number
   */
  async findByOrgNumber(
    organizationNumber: string
  ): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { organizationNumber },
    });
  }

  /**
   * Find all verified organizations
   */
  async findVerified(options?: FindAllOptions): Promise<any> {
    const { pagination, includeDeleted } = this.normalizeOptions(options);
    const { skip, take } = this.applyPagination(pagination);

    const [organizations, total] = await Promise.all([
      this.prisma.organization.findMany({
        where: {
          verificationStatus: VerificationStatus.VERIFIED,
          deletedAt: includeDeleted ? undefined : null,
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.organization.count({
        where: {
          verificationStatus: VerificationStatus.VERIFIED,
          deletedAt: includeDeleted ? undefined : null,
        },
      }),
    ]);

    return this.createPaginatedResult(organizations, total, pagination);
  }

  async findByOrganizationNumber(organizationNumber: string): Promise<Organization | null> {
    return this.prisma.organization.findUnique({
      where: { organizationNumber },
    });
  }

  async updateVerificationStatus(
    id: string,
    verificationStatus: VerificationStatus
  ): Promise<Organization> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        verificationStatus,
        verifiedAt: verificationStatus === VerificationStatus.VERIFIED ? new Date() : null,
      },
    });
  }

  /**
   * Find organizations pending verification
   */
  async findPendingVerification(): Promise<Organization[]> {
    return this.prisma.organization.findMany({
      where: {
        verificationStatus: VerificationStatus.PENDING,
        deletedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
  }

  /**
   * Find all organizations
   */
  async findAll(options?: FindAllOptions): Promise<Organization[]> {
    const { skip, take } = this.applyPagination(options?.pagination);

    return this.prisma.organization.findMany({
      where: {
        deletedAt: options?.includeDeleted ? undefined : null,
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Create new organization
   */
  async create(data: Omit<Organization, "id" | "createdAt" | "updatedAt">): Promise<Organization> {
    return this.prisma.organization.create({
      data,
    });
  }

  /**
   * Update organization
   */
  async update(
    id: string,
    data: Partial<Omit<Organization, "id" | "createdAt" | "updatedAt">>
  ): Promise<Organization> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.organization.update({
      where: { id },
      data,
    });
  }

  /**
   * Hard delete organization
   */
  async delete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.organization.delete({
      where: { id },
    });
  }

  /**
   * Soft delete organization
   */
  async softDelete(id: string): Promise<void> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Verify organization
   */
  async verify(
    id: string,
    verificationStatus: VerificationStatus,
    verificationNote?: string
  ): Promise<Organization> {
    const existing = await this.findById(id);
    if (!existing) {
      this.throwNotFound(id);
    }

    return this.prisma.organization.update({
      where: { id },
      data: {
        verificationStatus,
        verificationNote,
        verifiedAt:
          verificationStatus === VerificationStatus.VERIFIED
            ? new Date()
            : null,
      },
    });
  }
}