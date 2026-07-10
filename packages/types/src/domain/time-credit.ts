import { TimeCreditStatus } from "./enums";

/**
 * Time credit - reward for volunteer contributions
 */
export interface TimeCredit {
  id: string;
  userId: string;
  organizationId: string;
  hours: number;
  description: string;
  earnedDate: Date;
  expiryDate: Date | null;
  status: TimeCreditStatus;
  usedAt: Date | null;
  usedFor: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating a new time credit
 */
export type CreateTimeCreditInput = Omit<
  TimeCredit,
  "id" | "status" | "usedAt" | "usedFor" | "createdAt" | "updatedAt"
>;

/**
 * Input for redeeming a time credit
 */
export interface RedeemTimeCreditInput {
  usedFor: string;
}