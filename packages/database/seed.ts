/**
 * Database seed script for development and testing
 * Populates database with sample data
 */

import { PrismaClient } from "@prisma/client";
import {
  UserRole,
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
// Note: bcrypt will be installed in next phase, using placeholder hash for now
// const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

// Placeholder password hash for "Password123!" - will be replaced when bcrypt is installed
const TEST_PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYzpLaEm3Eu";

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (in reverse order of dependencies)
  await prisma.timeCredit.deleteMany();
  await prisma.skillsContribution.deleteMany();
  await prisma.timeContribution.deleteMany();
  await prisma.itemContribution.deleteMany();
  await prisma.moneyContribution.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.need.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();
  await prisma.recognitionPartner.deleteMany();

  console.log("✅ Cleaned existing data");

  // Create Users with authentication fields
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "contributor@example.com",
        name: "Lars Olsen",
        phone: "+4798765432",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        passwordHash: TEST_PASSWORD_HASH,
        emailVerified: true,
        lastLoginAt: new Date(),
      },
    }),
    prisma.user.create({
      data: {
        email: "orgadmin@example.com",
        name: "Kari Hansen",
        phone: "+4787654321",
        language: "no",
        role: UserRole.ORG_ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash: TEST_PASSWORD_HASH,
        emailVerified: true,
        lastLoginAt: new Date(Date.now() - 86400000), // 1 day ago
      },
    }),
    prisma.user.create({
      data: {
        email: "admin@example.com",
        name: "Erik Johansen",
        phone: "+4776543210",
        language: "no",
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
        passwordHash: TEST_PASSWORD_HASH,
        emailVerified: true,
        lastLoginAt: new Date(Date.now() - 3600000), // 1 hour ago
      },
    }),
    prisma.user.create({
      data: {
        email: "unverified@example.com",
        name: "Unverified User",
        phone: "+4765432109",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        passwordHash: TEST_PASSWORD_HASH,
        emailVerified: false,
        emailVerificationToken: "verify_token_12345",
        emailVerificationExpiry: new Date(Date.now() + 86400000), // 24 hours from now
      },
    }),
  ]);

  console.log("✅ Created users with authentication data");

  // Create sample refresh tokens for active users
  await Promise.all([
    prisma.refreshToken.create({
      data: {
        userId: users[0].id,
        token: "hashed_refresh_token_1",
        expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        ipAddress: "192.168.1.100",
      },
    }),
    prisma.refreshToken.create({
      data: {
        userId: users[1].id,
        token: "hashed_refresh_token_2",
        expiresAt: new Date(Date.now() + 7 * 86400000),
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        ipAddress: "192.168.1.101",
      },
    }),
  ]);

  console.log("✅ Created refresh tokens");

  // Create sample audit logs
  await Promise.all([
    prisma.auditLog.create({
      data: {
        userId: users[0].id,
        action: "LOGIN",
        success: true,
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        details: { method: "email_password" },
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: users[1].id,
        action: "LOGIN",
        success: true,
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
        details: { method: "email_password" },
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: null,
        action: "LOGIN",
        success: false,
        ipAddress: "192.168.1.200",
        userAgent: "Mozilla/5.0",
        details: { reason: "invalid_credentials", email: "wrong@example.com" },
        createdAt: new Date(Date.now() - 3600000),
      },
    }),
  ]);

  console.log("✅ Created audit logs");

  // Create Organizations
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Oslo Røde Kors",
        organizationNumber: "970102287",
        type: OrganizationType.CHARITY,
        description: "Oslo avdeling av Røde Kors. Vi jobber med humanitært arbeid i lokalsamfunnet.",
        email: "oslo@redcross.no",
        phone: "+4722054000",
        website: "https://www.rodekors.no/oslo",
        adminUserId: users[1].id,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
        city: "Oslo",
        address: "Hausmanns gate 7, 0186 Oslo",
      },
    }),
    prisma.organization.create({
      data: {
        name: "Bergen Dyrebeskyttelse",
        organizationNumber: "970445790",
        type: OrganizationType.NON_PROFIT,
        description: "Dyrevelferd og dyrebeskyttelse i Bergen og omegn.",
        email: "post@bergendyrebeskyttelse.no",
        phone: "+4755327000",
        website: "https://www.bergendyrebeskyttelse.no",
        adminUserId: users[1].id,
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
        city: "Bergen",
        address: "Hesthaugveien 2, 5231 Paradis",
      },
    }),
  ]);

  console.log("✅ Created organizations");

  // Create Campaigns
  const campaigns = await Promise.all([
    prisma.campaign.create({
      data: {
        organizationId: organizations[0].id,
        title: "Gi barn i Norge en trygg jul",
        description: "Hjelp oss med å sikre at alle barn i Norge kan oppleve gleden ved julen. Vi samler inn penger, gaver og frivillige til våre julearrangementer.",
        goalAmount: 250000,
        images: ["/campaigns/christmas-campaign.jpg"],
        startDate: new Date("2026-11-01"),
        endDate: new Date("2026-12-24"),
        status: CampaignStatus.ACTIVE,
        visibility: CampaignVisibility.PUBLIC,
      },
    }),
    prisma.campaign.create({
      data: {
        organizationId: organizations[0].id,
        title: "Skolemateriell til barn i Syria",
        description: "Støtt vårt arbeid med å gi utdanning til barn i Syria. Vi trenger både økonomisk støtte og frivillige.",
        goalAmount: 500000,
        currentAmount: 125000,
        images: ["/campaigns/syria-education.jpg"],
        startDate: new Date("2026-06-01"),
        endDate: new Date("2026-12-31"),
        status: CampaignStatus.ACTIVE,
        visibility: CampaignVisibility.PUBLIC,
      },
    }),
    prisma.campaign.create({
      data: {
        organizationId: organizations[1].id,
        title: "Bistand til flyktninger",
        description: "Vi hjelper flyktninger med integrering i Norge. Trenger både økonomisk støtte og frivillige.",
        goalAmount: 300000,
        currentAmount: 75000,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        status: CampaignStatus.ACTIVE,
        visibility: CampaignVisibility.PUBLIC,
      },
    }),
    prisma.campaign.create({
      data: {
        organizationId: organizations[2].id,
        title: "Nytt utstyr til ungdomslaget",
        description: "Vi trenger nytt treningsutstyr til vårt ungdomslag. Søker både penger og utstyrslån.",
        goalAmount: 50000,
        currentAmount: 15000,
        startDate: new Date("2026-05-01"),
        endDate: new Date("2026-08-31"),
        status: CampaignStatus.ACTIVE,
        visibility: CampaignVisibility.PUBLIC,
      },
    }),
  ]);

  console.log(`Created ${campaigns.length} campaigns`);

  // Create Needs
  const needs = await Promise.all([
    // Money needs
    prisma.need.create({
      data: {
        campaignId: campaigns[0].id,
        title: "Julemat til 50 familier",
        description: "Vi trenger 25,000 kr til innkjøp av julemat",
        type: NeedType.MONEY,
        targetAmount: 25000,
        currentAmount: 5000,
        status: NeedStatus.OPEN,
      },
    }),
    prisma.need.create({
      data: {
        campaignId: campaigns[1].id,
        title: "Skolebøker og penner",
        description: "Økonomisk støtte til skolemateriell",
        type: NeedType.MONEY,
        targetAmount: 100000,
        currentAmount: 25000,
        status: NeedStatus.OPEN,
      },
    }),
    // Volunteer needs
    prisma.need.create({
      data: {
        campaignId: campaigns[0].id,
        title: "Julearrangement frivillige",
        description: "Trenger 10 frivillige til å arrangere julebord",
        type: NeedType.VOLUNTEER,
        targetQuantity: 10,
        currentQuantity: 3,
        volunteerDate: new Date("2026-12-20"),
        volunteerStartTime: "14:00",
        volunteerEndTime: "20:00",
        status: NeedStatus.OPEN,
      },
    }),
    prisma.need.create({
      data: {
        campaignId: campaigns[2].id,
        title: "Norskundervisning frivillige",
        description: "Trenger språklærere til norskundervisning",
        type: NeedType.VOLUNTEER,
        targetQuantity: 5,
        currentQuantity: 2,
        status: NeedStatus.OPEN,
      },
    }),
    // Goods needs
    prisma.need.create({
      data: {
        campaignId: campaigns[0].id,
        title: "Julegaver til barn",
        description: "Samler inn julegaver til barn i vanskeligstilte familier",
        type: NeedType.GOODS,
        targetQuantity: 50,
        currentQuantity: 12,
        status: NeedStatus.OPEN,
      },
    }),
    prisma.need.create({
      data: {
        campaignId: campaigns[2].id,
        title: "Klær og sko til flyktninger",
        description: "Samler inn godt brukte klær og sko",
        type: NeedType.GOODS,
        targetQuantity: 100,
        currentQuantity: 35,
        status: NeedStatus.OPEN,
      },
    }),
    // Equipment needs
    prisma.need.create({
      data: {
        campaignId: campaigns[3].id,
        title: "Fotballutstyr til lån",
        description: "Trenger fotballutstyr til treningssamling",
        type: NeedType.EQUIPMENT,
        targetQuantity: 20,
        currentQuantity: 5,
        equipmentStartDate: new Date("2026-06-15"),
        equipmentEndDate: new Date("2026-06-22"),
        status: NeedStatus.OPEN,
      },
    }),
    // Skills needs
    prisma.need.create({
      data: {
        campaignId: campaigns[2].id,
        title: "Juridisk bistand",
        description: "Trenger advokat til å hjelpe med asylsaker",
        type: NeedType.SKILLS,
        status: NeedStatus.OPEN,
      },
    }),
  ]);

  console.log(`Created ${needs.length} needs`);

  // Create Contributions with type-specific data
  const contributions = await Promise.all([
    // Money contributions
    prisma.contribution.create({
      data: {
        needId: needs[0].id,
        userId: users[2].id,
        contributionType: ContributionType.MONEY,
        status: ContributionStatus.CONFIRMED,
        message: "God jul til alle!",
        moneyContribution: {
          create: {
            amount: 500,
            currency: "NOK",
            paymentStatus: PaymentStatus.COMPLETED,
            paymentIntentId: "pi_test_123456",
            receiptUrl: "https://receipt.test/123456",
            paidAt: new Date(),
          },
        },
      },
    }),
    prisma.contribution.create({
      data: {
        needId: needs[1].id,
        userId: users[3].id,
        contributionType: ContributionType.MONEY,
        status: ContributionStatus.CONFIRMED,
        moneyContribution: {
          create: {
            amount: 1000,
            currency: "NOK",
            paymentStatus: PaymentStatus.COMPLETED,
            paymentIntentId: "pi_test_123457",
            receiptUrl: "https://receipt.test/123457",
            paidAt: new Date(),
          },
        },
      },
    }),
    // Volunteer contributions
    prisma.contribution.create({
      data: {
        needId: needs[2].id,
        userId: users[2].id,
        contributionType: ContributionType.VOLUNTEER,
        status: ContributionStatus.CONFIRMED,
        message: "Gleder meg til å hjelpe!",
        volunteerContribution: {
          create: {
            hours: 6,
            volunteerDate: new Date("2026-12-20"),
            startTime: "14:00",
            endTime: "20:00",
            skills: "Erfaring med arrangementer",
            checkedIn: false,
          },
        },
      },
    }),
    prisma.contribution.create({
      data: {
        needId: needs[3].id,
        userId: users[3].id,
        contributionType: ContributionType.VOLUNTEER,
        status: ContributionStatus.CONFIRMED,
        message: "Har undervist norsk før",
        volunteerContribution: {
          create: {
            hours: 4,
            skills: "Norsk som andrespråk, 5 års erfaring",
            checkedIn: false,
          },
        },
      },
    }),
    // Goods contributions
    prisma.contribution.create({
      data: {
        needId: needs[4].id,
        userId: users[2].id,
        contributionType: ContributionType.GOODS,
        status: ContributionStatus.PENDING,
        message: "Har samlet leker og bøker",
        goodsContribution: {
          create: {
            items: [
              { name: "LEGO sett", quantity: 2, condition: "NY" },
              { name: "Barnebøker", quantity: 5, condition: "GOD" },
            ],
            condition: ItemCondition.GOOD,
            deliveryMethod: DeliveryMethod.DROP_OFF,
            photos: ["/goods/toys-books.jpg"],
          },
        },
      },
    }),
    // Equipment contributions
    prisma.contribution.create({
      data: {
        needId: needs[6].id,
        userId: users[2].id,
        contributionType: ContributionType.EQUIPMENT,
        status: ContributionStatus.CONFIRMED,
        message: "Kan låne ut fotballutstyr",
        equipmentContribution: {
          create: {
            equipment: [
              { name: "Fotball", quantity: 5, condition: "GOD" },
              { name: "Kjegler", quantity: 10, condition: "GOD" },
            ],
            startDate: new Date("2026-06-15"),
            endDate: new Date("2026-06-22"),
            condition: ItemCondition.GOOD,
            deliveryMethod: DeliveryMethod.DROP_OFF,
            returned: false,
          },
        },
      },
    }),
    // Skills contributions
    prisma.contribution.create({
      data: {
        needId: needs[7].id,
        userId: users[3].id,
        contributionType: ContributionType.SKILLS,
        status: ContributionStatus.CONFIRMED,
        message: "Kan bistå med juridisk rådgivning",
        skillsContribution: {
          create: {
            skillDescription: "Advokat spesialisert på asylrett, 10 års erfaring",
            estimatedHours: 20,
            delivered: false,
          },
        },
      },
    }),
  ]);

  console.log(`Created ${contributions.length} contributions`);

  // Create Time Credits
  const timeCredits = await Promise.all([
    prisma.timeCredit.create({
      data: {
        userId: users[2].id,
        organizationId: organizations[0].id,
        contributionId: contributions[2].id,
        hours: 6,
        status: TimeCreditStatus.ACTIVE,
        expiresAt: new Date("2027-12-31"),
      },
    }),
    prisma.timeCredit.create({
      data: {
        userId: users[3].id,
        organizationId: organizations[1].id,
        contributionId: contributions[3].id,
        hours: 4,
        status: TimeCreditStatus.ACTIVE,
        expiresAt: new Date("2027-12-31"),
      },
    }),
  ]);

  console.log(`Created ${timeCredits.length} time credits`);

  // Create Recognition Partners
  const partners = await Promise.all([
    prisma.recognitionPartner.create({
      data: {
        name: "Kaffebrenneriet",
        description: "Norges beste kaffe",
        website: "https://www.kaffebrenneriet.no",
        contactEmail: "partner@kaffebrenneriet.no",
        contactPhone: "+4721234567",
        benefits: [
          {
            title: "10% rabatt",
            description: "10% rabatt på all kaffe med Time Credit",
            requiredHours: 5,
          },
          {
            title: "Gratis kaffe",
            description: "Gratis kaffe ved 20 timer",
            requiredHours: 20,
          },
        ],
        status: PartnerStatus.ACTIVE,
      },
    }),
    prisma.recognitionPartner.create({
      data: {
        name: "XXL Sport",
        description: "Norges største sportskjede",
        website: "https://www.xxl.no",
        contactEmail: "partner@xxl.no",
        contactPhone: "+4722345678",
        benefits: [
          {
            title: "15% rabatt på sportutstyr",
            description: "15% rabatt på alt sportutstyr",
            requiredHours: 10,
          },
        ],
        status: PartnerStatus.ACTIVE,
      },
    }),
  ]);

  console.log(`Created ${partners.length} recognition partners`);

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