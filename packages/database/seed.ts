/**
 * Database seed script for development and testing
 */

import { PrismaClient } from "@prisma/client";
import {
  UserStatus,
  OrganizationType,
  VerificationStatus,
  OrganizationStatus,
  CampaignStatus,
  CampaignVisibility,
  NeedType,
  NeedStatus,
  ContributionType,
  ContributionStatus,
  PaymentStatus,
  ItemCondition,
  DeliveryMethod,
  TimeCreditStatus,
  PartnerStatus,
} from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Hash password for test users
  const testPasswordHash = await argon2.hash("Password123!", {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });

  // Clean existing data
  await prisma.timeCredit.deleteMany();
  await prisma.skillsContribution.deleteMany();
  await prisma.timeContribution.deleteMany();
  await prisma.itemContribution.deleteMany();
  await prisma.moneyContribution.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.need.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.authenticationAuditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.recognitionPartner.deleteMany();

  console.log("✅ Cleaned existing data");

  // Create roles
  const userRole = await prisma.role.create({
    data: {
      name: "user",
      description: "Regular platform user",
      isSystem: true,
    },
  });

  const orgAdminRole = await prisma.role.create({
    data: {
      name: "org_admin",
      description: "Organization administrator",
      isSystem: true,
    },
  });

  const platformAdminRole = await prisma.role.create({
    data: {
      name: "platform_admin",
      description: "Platform administrator",
      isSystem: true,
    },
  });

  console.log("✅ Created roles");

  // Create users
  const contributor = await prisma.user.create({
    data: {
      email: "contributor@example.com",
      name: "Lars Olsen",
      phone: "+4798765432",
      language: "no",
      status: UserStatus.ACTIVE,
      passwordHash: testPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  const orgAdmin = await prisma.user.create({
    data: {
      email: "orgadmin@example.com",
      name: "Kari Hansen",
      phone: "+4787654321",
      language: "no",
      status: UserStatus.ACTIVE,
      passwordHash: testPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 86400000),
      failedLoginAttempts: 0,
      roles: {
        create: {
          roleId: orgAdminRole.id,
        },
      },
    },
  });

  const platformAdmin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Erik Johansen",
      phone: "+4776543210",
      language: "no",
      status: UserStatus.ACTIVE,
      passwordHash: testPasswordHash,
      emailVerified: true,
      lastLoginAt: new Date(Date.now() - 3600000),
      failedLoginAttempts: 0,
      roles: {
        create: {
          roleId: platformAdminRole.id,
        },
      },
    },
  });

  const unverifiedUser = await prisma.user.create({
    data: {
      email: "unverified@example.com",
      name: "Unverified User",
      phone: "+4765432109",
      language: "no",
      status: UserStatus.ACTIVE,
      passwordHash: testPasswordHash,
      emailVerified: false,
      emailVerificationToken: "verify_token_12345",
      emailVerificationExpiry: new Date(Date.now() + 86400000),
      failedLoginAttempts: 0,
      roles: {
        create: {
          roleId: userRole.id,
        },
      },
    },
  });

  console.log("✅ Created users with roles");

  // Create refresh tokens
  await prisma.refreshToken.createMany({
    data: [
      {
        userId: contributor.id,
        token: "hashed_refresh_token_1",
        expiresAt: new Date(Date.now() + 7 * 86400000),
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ipAddress: "192.168.1.100",
      },
      {
        userId: orgAdmin.id,
        token: "hashed_refresh_token_2",
        expiresAt: new Date(Date.now() + 7 * 86400000),
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        ipAddress: "192.168.1.101",
      },
    ],
  });

  console.log("✅ Created refresh tokens");

  // Create audit logs
  await prisma.authenticationAuditLog.createMany({
    data: [
      {
        userId: contributor.id,
        action: "LOGIN",
        result: "success",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        details: { method: "email_password" },
      },
      {
        userId: orgAdmin.id,
        action: "LOGIN",
        result: "success",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        details: { method: "email_password" },
      },
      {
        userId: null,
        action: "LOGIN",
        result: "failure",
        ipAddress: "192.168.1.200",
        userAgent: "Mozilla/5.0",
        details: { reason: "invalid_credentials", email: "wrong@example.com" },
        createdAt: new Date(Date.now() - 3600000),
      },
    ],
  });

  console.log("✅ Created audit logs");

  // Create organizations
  const orgs = await prisma.organization.createMany({
    data: [
      {
        name: "Oslo Røde Kors",
        organizationNumber: "970102287",
        type: OrganizationType.CHARITY,
        description: "Oslo avdeling av Røde Kors",
        email: "oslo@redcross.no",
        phone: "+4722054000",
        website: "https://www.rodekors.no/oslo",
        adminUserId: orgAdmin.id,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
        city: "Oslo",
        address: "Hausmanns gate 7, 0186 Oslo",
      },
      {
        name: "Bergen Dyrebeskyttelse",
        organizationNumber: "970445790",
        type: OrganizationType.NON_PROFIT,
        description: "Dyrevelferd i Bergen",
        email: "post@bergendyrebeskyttelse.no",
        phone: "+4755327000",
        website: "https://www.bergendyrebeskyttelse.no",
        adminUserId: orgAdmin.id,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
        city: "Bergen",
        address: "Hesthaugveien 2, 5231 Paradis",
      },
    ],
  });

  console.log("✅ Created organizations");

  const organization = await prisma.organization.findFirst();
  if (!organization) throw new Error("No organization created");

  // Create campaigns
  const campaign = await prisma.campaign.create({
    data: {
      organizationId: organization.id,
      title: "Gi barn i Norge en trygg jul",
      description: "Hjelp oss med å sikre at alle barn i Norge kan oppleve gleden ved julen.",
      startDate: new Date("2026-11-01"),
      endDate: new Date("2026-12-24"),
      status: CampaignStatus.ACTIVE,
      visibility: CampaignVisibility.PUBLIC,
    },
  });

  console.log("✅ Created campaigns");

  // Create needs
  const need = await prisma.need.create({
    data: {
      campaignId: campaign.id,
      title: "Julemat til 50 familier",
      description: "Vi trenger 25,000 kr til innkjøp av julemat",
      type: NeedType.MONEY,
      targetAmount: 25000,
      currentAmount: 5000,
      status: NeedStatus.OPEN,
    },
  });

  console.log("✅ Created needs");

  // Create contribution
  await prisma.contribution.create({
    data: {
      needId: need.id,
      userId: contributor.id,
      type: ContributionType.MONEY,
      status: ContributionStatus.PENDING,
      notes: "God jul til alle!",
      money: {
        create: {
          amount: 500,
          currency: "NOK",
          paymentStatus: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      },
    },
  });

  console.log("✅ Created contributions");

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });