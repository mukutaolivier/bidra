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

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Clear existing data (in reverse order of dependencies)
  await prisma.skillsContribution.deleteMany();
  await prisma.equipmentContribution.deleteMany();
  await prisma.goodsContribution.deleteMany();
  await prisma.volunteerContribution.deleteMany();
  await prisma.moneyContribution.deleteMany();
  await prisma.contribution.deleteMany();
  await prisma.timeCredit.deleteMany();
  await prisma.need.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.recognitionPartner.deleteMany();
  await prisma.user.deleteMany();

  console.log("Cleared existing data");

  // Create Users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: "admin@bidra.no",
        name: "Platform Administrator",
        phone: "+4741234567",
        language: "no",
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: "org.admin@reddebarna.no",
        name: "Kari Nordmann",
        phone: "+4741234568",
        language: "no",
        role: UserRole.ORG_ADMIN,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: "contributor1@example.no",
        name: "Ole Hansen",
        phone: "+4741234569",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    }),
    prisma.user.create({
      data: {
        email: "contributor2@example.no",
        name: "Ingrid Johansen",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create Organizations
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Redd Barna Norge",
        organizationNumber: "940958708",
        type: OrganizationType.CHARITY,
        description: "Redd Barna jobber for barns rettigheter i Norge og over hele verden.",
        website: "https://www.reddbarna.no",
        email: "info@reddbarna.no",
        phone: "+4722995000",
        address: "Brynsalléen 12",
        city: "Oslo",
        postalCode: "0667",
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
        stripeAccountId: "acct_test_reddebarna",
      },
    }),
    prisma.organization.create({
      data: {
        name: "Norsk Folkehjelp",
        organizationNumber: "971277882",
        type: OrganizationType.CHARITY,
        description: "Norsk Folkehjelp arbeider for solidaritet og en mer rettferdig fordeling av makt og ressurser.",
        website: "https://www.folkehjelp.no",
        email: "post@folkehjelp.no",
        phone: "+4722033100",
        address: "Stortorvet 10",
        city: "Oslo",
        postalCode: "0155",
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
        stripeAccountId: "acct_test_folkehjelp",
      },
    }),
    prisma.organization.create({
      data: {
        name: "Lokal Idrettsklubb",
        organizationNumber: "123456789",
        type: OrganizationType.SPORTS,
        description: "Lokalt idrettslag som fremmer fysisk aktivitet for barn og unge.",
        email: "kontakt@lokalidrett.no",
        phone: "+4741234570",
        address: "Idrettsveien 5",
        city: "Bergen",
        postalCode: "5003",
        verificationStatus: VerificationStatus.PENDING,
        status: OrganizationStatus.ACTIVE,
      },
    }),
  ]);

  console.log(`Created ${organizations.length} organizations`);

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

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });