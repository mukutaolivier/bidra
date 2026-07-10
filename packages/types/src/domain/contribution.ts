import {
  ContributionType,
  ContributionStatus,
  PaymentStatus,
  ItemCondition,
  DeliveryMethod,
  DeliveryStatus,
  LoanReturnStatus,
} from "./enums";

/**
 * Base contribution record
 */
export interface Contribution {
  id: string;
  needId: string;
  userId: string;
  contributionType: ContributionType;
  status: ContributionStatus;
  message: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/**
 * Money contribution - financial donation
 */
export interface MoneyContribution {
  id: string;
  contributionId: string;
  amount: number;
  currency: string;
  stripePaymentIntentId: string | null;
  paymentStatus: PaymentStatus;
  receiptUrl: string | null;
  receiptIssuedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Volunteer contribution - time commitment
 */
export interface VolunteerContribution {
  id: string;
  contributionId: string;
  hours: number;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  skills: string | null;
  checkedIn: boolean;
  checkedInAt: Date | null;
  checkedOut: boolean;
  checkedOutAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Item in a goods contribution
 */
export interface GoodsItem {
  name: string;
  quantity: number;
  description?: string;
  estimatedValue?: number;
}

/**
 * Goods contribution - physical item donation
 */
export interface GoodsContribution {
  id: string;
  contributionId: string;
  /** Array of donated items */
  items: GoodsItem[];
  condition: ItemCondition;
  deliveryMethod: DeliveryMethod;
  deliveryStatus: DeliveryStatus;
  deliveryDate: Date | null;
  /** Array of photo URLs */
  photoUrls: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Equipment item in an equipment contribution
 */
export interface EquipmentItem {
  name: string;
  description?: string;
  estimatedValue?: number;
  serialNumber?: string;
}

/**
 * Equipment contribution - temporary item loan
 */
export interface EquipmentContribution {
  id: string;
  contributionId: string;
  /** Array of loaned equipment */
  equipment: EquipmentItem[];
  loanPeriodStart: Date;
  loanPeriodEnd: Date;
  condition: ItemCondition;
  conditionNotes: string | null;
  returnStatus: LoanReturnStatus;
  returnedAt: Date | null;
  returnNotes: string | null;
  /** Array of photo URLs */
  photoUrls: string[] | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Skills contribution - professional expertise
 */
export interface SkillsContribution {
  id: string;
  contributionId: string;
  skillDescription: string;
  estimatedHours: number;
  deliveryDate: Date | null;
  completedAt: Date | null;
  feedbackRating: number | null;
  feedbackComment: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Full contribution with type-specific data
 */
export interface ContributionWithDetails extends Contribution {
  moneyContribution?: MoneyContribution;
  volunteerContribution?: VolunteerContribution;
  goodsContribution?: GoodsContribution;
  equipmentContribution?: EquipmentContribution;
  skillsContribution?: SkillsContribution;
}

/**
 * Input for creating a new contribution
 */
export type CreateContributionInput = Omit<
  Contribution,
  "id" | "status" | "createdAt" | "updatedAt" | "deletedAt"
>;

/**
 * Input for updating an existing contribution
 */
export type UpdateContributionInput = Partial<
  Omit<
    Contribution,
    "id" | "needId" | "userId" | "contributionType" | "createdAt" | "updatedAt" | "deletedAt"
  >
>;

/**
 * Type guard for money contribution
 */
export function isMoneyContribution(
  contribution: ContributionWithDetails
): contribution is ContributionWithDetails & {
  moneyContribution: MoneyContribution;
} {
  return contribution.contributionType === ContributionType.MONEY;
}

/**
 * Type guard for volunteer contribution
 */
export function isVolunteerContribution(
  contribution: ContributionWithDetails
): contribution is ContributionWithDetails & {
  volunteerContribution: VolunteerContribution;
} {
  return contribution.contributionType === ContributionType.VOLUNTEER;
}

/**
 * Type guard for goods contribution
 */
export function isGoodsContribution(
  contribution: ContributionWithDetails
): contribution is ContributionWithDetails & {
  goodsContribution: GoodsContribution;
} {
  return contribution.contributionType === ContributionType.GOODS;
}

/**
 * Type guard for equipment contribution
 */
export function isEquipmentContribution(
  contribution: ContributionWithDetails
): contribution is ContributionWithDetails & {
  equipmentContribution: EquipmentContribution;
} {
  return contribution.contributionType === ContributionType.EQUIPMENT;
}

/**
 * Type guard for skills contribution
 */
export function isSkillsContribution(
  contribution: ContributionWithDetails
): contribution is ContributionWithDetails & {
  skillsContribution: SkillsContribution;
} {
  return contribution.contributionType === ContributionType.SKILLS;
}