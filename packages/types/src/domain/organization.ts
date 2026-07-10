import {
  OrganizationType,
  VerificationStatus,
  OrganizationStatus,
} from "./enums";

/**
 * Norwegian organization (non-profit, charity, community group, etc.)
 * Must be verified before creating campaigns
 */
export interface Organization {
  id: string;
  name: string;
  description: string | null;
  organizationType: OrganizationType;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  /** Norwegian organization number (9 digits) */
  organizationNumber: string;
  verificationStatus: VerificationStatus;
  verificationNote: string | null;
  verifiedAt: Date | null;
  /** Stripe Connect account ID for receiving payments */
  stripeAccountId: string | null;
  stripeOnboarded: boolean;
  status: OrganizationStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Input for creating a new organization
 */
export type CreateOrganizationInput = Omit<
  Organization,
  | "id"
  | "verificationStatus"
  | "verificationNote"
  | "verifiedAt"
  | "stripeAccountId"
  | "stripeOnboarded"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "deletedAt"
>;

/**
 * Input for updating an existing organization
 */
export type UpdateOrganizationInput = Partial<
  Omit<
    Organization,
    | "id"
    | "organizationNumber"
    | "verificationStatus"
    | "verifiedAt"
    | "stripeAccountId"
    | "stripeOnboarded"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  >
>;

/**
 * Input for organization verification (admin only)
 */
export interface VerifyOrganizationInput {
  verificationStatus: VerificationStatus;
  verificationNote?: string;
}