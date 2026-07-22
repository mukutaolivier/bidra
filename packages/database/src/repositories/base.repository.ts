import { PrismaClient } from "@prisma/client";
import {
  FindAllOptions,
  PaginatedResult,
  PaginationOptions,
} from "../types/repository.types";
import { EntityNotFoundError } from "../exceptions";

/**
 * Base repository providing common CRUD operations
 * All entity repositories extend this class
 */
export abstract class BaseRepository<T> {
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  /**
   * Find entity by ID
   */
  abstract findById(id: string): Promise<T | null>;

  /**
   * Find all entities with optional filtering and pagination
   */
  abstract findAll(options?: FindAllOptions): Promise<T[]>;

  /**
   * Create new entity
   */
  abstract create(data: unknown): Promise<T>;

  /**
   * Update existing entity
   */
  abstract update(id: string, data: unknown): Promise<T>;

  /**
   * Hard delete entity
   */
  abstract delete(id: string): Promise<void>;

  /**
   * Soft delete entity (set deletedAt timestamp)
   */
  abstract softDelete(id: string): Promise<void>;

  /**
   * Helper to apply pagination
   */
  protected applyPagination(options?: PaginationOptions) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const skip = (page - 1) * limit;

    return { skip, take: limit };
  }

  protected normalizeOptions(options?: FindAllOptions) {
    const pagination = options?.pagination ?? {
      page: options?.page ?? 1,
      limit: options?.limit ?? 20,
    };

    return {
      pagination,
      where: options?.where,
      includeDeleted: options?.includeDeleted,
    };
  }

  /**
   * Helper to create paginated result
   */
  protected createPaginatedResult<TData>(
    data: TData[],
    total: number,
    options?: PaginationOptions
  ): PaginatedResult<TData> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Helper to throw entity not found error
   */
  protected throwNotFound(id: string): never {
    throw new EntityNotFoundError(this.modelName, id);
  }
}