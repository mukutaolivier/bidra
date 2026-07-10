// Common types and interfaces shared across the platform

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Placeholder types - actual domain types will be added later
export type EntityStatus = "active" | "inactive" | "pending" | "archived";

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}