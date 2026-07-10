import { CampaignStatus, CampaignVisibility } from "./enums";

/**
 * Campaign - fundraising, volunteer recruitment, or resource gathering
 */
export interface Campaign {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  /** Extended story/description for campaign page */
  story: string | null;
  /** Array of image URLs */
  images: string[] | null;
  /** Financial goal if monetary campaign */
  goal: number | null;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  status: CampaignStatus;
  visibility: CampaignVisibility;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Input for creating a new campaign
 */
export type CreateCampaignInput = Omit<
  Campaign,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * Input for updating an existing campaign
 */
export type UpdateCampaignInput = Partial<
  Omit<Campaign, "id" | "organizationId" | "createdAt" | "updatedAt" | "deletedAt">
>;