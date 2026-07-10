import { PrismaClient } from "@prisma/client";
import { ContributionRepository } from "../../repositories/contribution.repository";
import { UserRepository } from "../../repositories/user.repository";
import { OrganizationRepository } from "../../repositories/organization.repository";
import { CampaignRepository } from "../../repositories/campaign.repository";
import { NeedRepository } from "../../repositories/need.repository";
import {
  ContributionType,
  ContributionStatus,
  PaymentStatus,
  UserStatus,
  OrganizationType,
  VerificationStatus,
  OrganizationStatus,
  CampaignStatus,
  CampaignVisibility,
  NeedType,
  NeedStatus,
  ItemCondition,
  DeliveryMethod,
} from "@prisma/client";

const prisma = new PrismaClient();
const contributionRepo = new ContributionRepository(prisma);
const userRepo = new UserRepository(prisma);
const orgRepo = new OrganizationRepository(prisma);
const campaignRepo = new CampaignRepository(prisma);
const needRepo = new NeedRepository(prisma);

describe("ContributionRepository", () => {
  let testUser: any;
  let testOrg: any;
  let testCampaign: any;
  let testNeed: any;
  let testUserRole: any;

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear all data
    await prisma.skillsContribution.deleteMany();
    await prisma.timeContribution.deleteMany();
    await prisma.itemContribution.deleteMany();
    await prisma.moneyContribution.deleteMany();
    await prisma.contribution.deleteMany();
    await prisma.need.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.role.deleteMany();
    await prisma.user.deleteMany();

    // Create test role
    testUserRole = await prisma.role.create({
      data: {
        name: "user",
        description: "Test user role",
        isSystem: true,
      },
    });

    // Create test user
    testUser = await prisma.user.create({
      data: {
        email: "contributor@test.no",
        name: "Test Contributor",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
        roles: {
          create: {
            roleId: testUserRole.id,
          },
        },
      },
    });

    testOrg = await orgRepo.create({
      name: "Test Organization",
      organizationNumber: "999999999",
      type: OrganizationType.CHARITY,
      email: "org@test.no",
      city: "Oslo",
      verificationStatus: VerificationStatus.VERIFIED,
      status: OrganizationStatus.ACTIVE,
    });

    testCampaign = await campaignRepo.create({
      organizationId: testOrg.id,
      title: "Test Campaign",
      description: "Test campaign description",
      goalAmount: 100000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: CampaignStatus.ACTIVE,
      visibility: CampaignVisibility.PUBLIC,
    });

    testNeed = await needRepo.create({
      campaignId: testCampaign.id,
      title: "Test Need",
      description: "Test need description",
      type: NeedType.MONEY,
      targetAmount: 50000,
      status: NeedStatus.OPEN,
    });
  });

  describe("createMoneyContribution", () => {
    it("should create a money contribution with payment details", async () => {
      const contribution = await contributionRepo.create({
        needId: testNeed.id,
        userId: testUser.id,
        type: ContributionType.MONEY,
        status: ContributionStatus.PENDING,
        money: {
          create: {
            amount: 1000,
            currency: "NOK",
            paymentStatus: PaymentStatus.PENDING,
          },
        },
      });

      expect(contribution.type).toBe(ContributionType.MONEY);
      expect(contribution.money).toBeDefined();
      expect(contribution.money?.amount).toBe(1000);
    });
  });

  describe("createTimeContribution", () => {
    it("should create a time contribution", async () => {
      const timeNeed = await needRepo.create({
        campaignId: testCampaign.id,
        title: "Time Need",
        description: "Need volunteers",
        type: NeedType.TIME,
        targetQuantity: 10,
        status: NeedStatus.OPEN,
      });

      const contribution = await contributionRepo.create({
        needId: timeNeed.id,
        userId: testUser.id,
        type: ContributionType.TIME,
        status: ContributionStatus.CONFIRMED,
        time: {
          create: {
            hours: 4,
            date: new Date("2026-08-01"),
            startTime: "10:00",
            endTime: "14:00",
            checkedIn: false,
          },
        },
      });

      expect(contribution.type).toBe(ContributionType.TIME);
      expect(contribution.time).toBeDefined();
      expect(contribution.time?.hours).toBe(4);
    });
  });

  describe("createItemContribution", () => {
    it("should create an item contribution", async () => {
      const itemNeed = await needRepo.create({
        campaignId: testCampaign.id,
        title: "Item Need",
        description: "Need items",
        type: NeedType.ITEMS,
        targetQuantity: 20,
        status: NeedStatus.OPEN,
      });

      const contribution = await contributionRepo.create({
        needId: itemNeed.id,
        userId: testUser.id,
        type: ContributionType.ITEMS,
        status: ContributionStatus.PENDING,
        items: {
          create: {
            items: [
              { name: "Item 1", quantity: 2, condition: "NEW" },
              { name: "Item 2", quantity: 5, condition: "GOOD" },
            ],
            condition: ItemCondition.GOOD,
            deliveryMethod: DeliveryMethod.DROP_OFF,
          },
        },
      });

      expect(contribution.type).toBe(ContributionType.ITEMS);
      expect(contribution.items).toBeDefined();
      expect(contribution.items?.items).toHaveLength(2);
    });
  });

  describe("findByUser", () => {
    it("should find all contributions by user", async () => {
      await contributionRepo.create({
        needId: testNeed.id,
        userId: testUser.id,
        type: ContributionType.MONEY,
        status: ContributionStatus.CONFIRMED,
        money: {
          create: {
            amount: 500,
            currency: "NOK",
            paymentStatus: PaymentStatus.COMPLETED,
          },
        },
      });

      await contributionRepo.create({
        needId: testNeed.id,
        userId: testUser.id,
        type: ContributionType.MONEY,
        status: ContributionStatus.CONFIRMED,
        money: {
          create: {
            amount: 1000,
            currency: "NOK",
            paymentStatus: PaymentStatus.COMPLETED,
          },
        },
      });

      const result = await contributionRepo.findByUser(testUser.id, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });
  });

  describe("findByCampaign", () => {
    it("should find all contributions for a campaign", async () => {
      await contributionRepo.create({
        needId: testNeed.id,
        userId: testUser.id,
        type: ContributionType.MONEY,
        status: ContributionStatus.CONFIRMED,
        money: {
          create: {
            amount: 500,
            currency: "NOK",
            paymentStatus: PaymentStatus.COMPLETED,
          },
        },
      });

      const result = await contributionRepo.findByCampaign(testCampaign.id, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].need.campaignId).toBe(testCampaign.id);
    });
  });

  describe("updateStatus", () => {
    it("should update contribution status", async () => {
      const contribution = await contributionRepo.create({
        needId: testNeed.id,
        userId: testUser.id,
        type: ContributionType.MONEY,
        status: ContributionStatus.PENDING,
        money: {
          create: {
            amount: 1000,
            currency: "NOK",
            paymentStatus: PaymentStatus.PENDING,
          },
        },
      });

      const updated = await contributionRepo.updateStatus(
        contribution.id,
        ContributionStatus.CONFIRMED
      );

      expect(updated.status).toBe(ContributionStatus.CONFIRMED);
    });
  });
});