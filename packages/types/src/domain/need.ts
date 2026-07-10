import { NeedType, NeedStatus } from "./enums";

/**
 * Need - specific requirement for a campaign
 */
export interface Need {
  id: string;
  campaignId: string;
  title: string;
  description: string;
  needType: NeedType;
  quantity: number | null;
  quantityUnit: string | null;
  /** Estimated value for non-money needs */
  estimatedValue: number | null;
  deadline: Date | null;
  status: NeedStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Input for creating a new need
 */
export type CreateNeedInput = Omit<
  Need,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * Input for updating an existing need
 */
export type UpdateNeedInput = Partial<
  Omit<Need, "id" | "campaignId" | "createdAt" | "updatedAt" | "deletedAt">
>;