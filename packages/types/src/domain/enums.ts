/**
 * Domain enums matching Prisma schema
 * These enums are used for type safety and runtime validation
 */

export enum UserRole {
  USER = "USER",
  ORG_ADMIN = "ORG_ADMIN",
  PLATFORM_ADMIN = "PLATFORM_ADMIN",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum OrganizationType {
  NON_PROFIT = "NON_PROFIT",
  CHARITY = "CHARITY",
  COMMUNITY_GROUP = "COMMUNITY_GROUP",
  SPORTS_CLUB = "SPORTS_CLUB",
  SCHOOL = "SCHOOL",
  OTHER = "OTHER",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  VERIFIED = "VERIFIED",
  REJECTED = "REJECTED",
}

export enum OrganizationStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum CampaignStatus {
  DRAFT = "DRAFT",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum CampaignVisibility {
  PUBLIC = "PUBLIC",
  UNLISTED = "UNLISTED",
  PRIVATE = "PRIVATE",
}

export enum NeedType {
  MONEY = "MONEY",
  VOLUNTEER = "VOLUNTEER",
  GOODS = "GOODS",
  EQUIPMENT = "EQUIPMENT",
  SKILLS = "SKILLS",
  OTHER = "OTHER",
}

export enum NeedStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  FULFILLED = "FULFILLED",
  CANCELLED = "CANCELLED",
}

export enum ContributionType {
  MONEY = "MONEY",
  VOLUNTEER = "VOLUNTEER",
  GOODS = "GOODS",
  EQUIPMENT = "EQUIPMENT",
  SKILLS = "SKILLS",
  OTHER = "OTHER",
}

export enum ContributionStatus {
  PENDING = "PENDING",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SUCCEEDED = "SUCCEEDED",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

export enum ItemCondition {
  NEW = "NEW",
  GOOD = "GOOD",
  FAIR = "FAIR",
  POOR = "POOR",
}

export enum DeliveryMethod {
  DROP_OFF = "DROP_OFF",
  PICKUP = "PICKUP",
  SHIPPING = "SHIPPING",
}

export enum DeliveryStatus {
  PENDING = "PENDING",
  SCHEDULED = "SCHEDULED",
  IN_TRANSIT = "IN_TRANSIT",
  DELIVERED = "DELIVERED",
  FAILED = "FAILED",
}

export enum LoanReturnStatus {
  PENDING = "PENDING",
  ON_LOAN = "ON_LOAN",
  RETURNED = "RETURNED",
  OVERDUE = "OVERDUE",
  DAMAGED = "DAMAGED",
}

export enum TimeCreditStatus {
  ACTIVE = "ACTIVE",
  USED = "USED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum PartnerStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  PENDING = "PENDING",
}