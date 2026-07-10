/**
 * Pagination options for query results
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
}

/**
 * Sort options for query results
 */
export interface SortOptions {
  field: string;
  order: "asc" | "desc";
}

/**
 * Find all options combining pagination and sorting
 */
export interface FindAllOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
  includeDeleted?: boolean;
}

/**
 * Paginated result wrapper
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}