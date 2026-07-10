import { PartnerStatus } from "./enums";

/**
 * Benefit offered by a recognition partner
 */
export interface PartnerBenefit {
  title: string;
  description: string;
  discount?: string;
  termsUrl?: string;
}

/**
 * Recognition partner - business offering benefits to volunteers
 */
export interface RecognitionPartner {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  /** Array of benefits offered */
  benefits: PartnerBenefit[];
  city: string | null;
  address: string | null;
  status: PartnerStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Input for creating a new recognition partner
 */
export type CreateRecognitionPartnerInput = Omit<
  RecognitionPartner,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * Input for updating an existing recognition partner
 */
export type UpdateRecognitionPartnerInput = Partial<
  Omit<RecognitionPartner, "id" | "createdAt" | "updatedAt" | "deletedAt">
>;