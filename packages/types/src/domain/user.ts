import { UserRole, UserStatus } from "./enums";

/**
 * Platform user - can be contributor, organization admin, or platform admin
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  language: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Input for creating a new user
 */
export type CreateUserInput = Omit<
  User,
  "id" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * Input for updating an existing user
 */
export type UpdateUserInput = Partial<
  Omit<User, "id" | "email" | "createdAt" | "updatedAt" | "deletedAt">
>;