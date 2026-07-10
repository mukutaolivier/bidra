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
  UserRole,
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

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Clear all data
    await prisma.skillsContribution.deleteMany();
    await prisma.equipmentContribution.deleteMany();
    await prisma.goodsContribution.deleteMany();
    await prisma.volunteerContribution.deleteMany();
    await prisma.moneyContribution.deleteMany();
    await prisma.contribution.deleteMany();
    await prisma.need.deleteMany();
    await prisma.campaign.deleteMany();
    await prisma.organization.deleteMany();
    await prisma.user.deleteMany();

    // Create test data
    testUser = await userRepo.create({
      email: "contributor@test.no",
      name: "Test Contributor",
      language: "no",
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
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
      const contribution = await contributionRepo.createMoneyContribution(
        {
          needId: testNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.MONEY,
          status: ContributionStatus.PENDING,
        },
        {
          amount: 1000,
          currency: "NOK",
          paymentStatus: PaymentStatus.PENDING,
        }
      );

      expect(contribution.contributionType).toBe(ContributionType.MONEY);
      expect(contribution.moneyContribution).toBeDefined();
      expect(contribution.moneyContribution?.amount).toBe(1000);
    });
  });

  describe("createVolunteerContribution", () => {
    it("should create a volunteer contribution", async () => {
      const volunteerNeed = await needRepo.create({
        campaignId: testCampaign.id,
        title: "Volunteer Need",
        description: "Need volunteers",
        type: NeedType.VOLUNTEER,
        targetQuantity: 10,
        status: NeedStatus.OPEN,
      });

      const contribution = await contributionRepo.createVolunteerContribution(
        {
          needId: volunteerNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.VOLUNTEER,
          status: ContributionStatus.CONFIRMED,
        },
        {
          hours: 4,
          volunteerDate: new Date("2026-08-01"),
          startTime: "10:00",
          endTime: "14:00",
          skills: "Event planning",
          checkedIn: false,
        }
      );

      expect(contribution.contributionType).toBe(ContributionType.VOLUNTEER);
      expect(contribution.volunteerContribution).toBeDefined();
      expect(contribution.volunteerContribution?.hours).toBe(4);
    });
  });

  describe("createGoodsContribution", () => {
    it("should create a goods contribution", async () => {
      const goodsNeed = await needRepo.create({
        campaignId: testCampaign.id,
        title: "Goods Need",
        description: "Need items",
        type: NeedType.GOODS,
        targetQuantity: 20,
        status: NeedStatus.OPEN,
      });

      const contribution = await contributionRepo.createGoodsContribution(
        {
          needId: goodsNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.GOODS,
          status: ContributionStatus.PENDING,
        },
        {
          items: [
            { name: "Item 1", quantity: 2, condition: "NEW" },
            { name: "Item 2", quantity: 5, condition: "GOOD" },
          ],
          condition: ItemCondition.GOOD,
          deliveryMethod: DeliveryMethod.DROP_OFF,
        }
      );

      expect(contribution.contributionType).toBe(ContributionType.GOODS);
      expect(contribution.goodsContribution).toBeDefined();
      expect(contribution.goodsContribution?.items).toHaveLength(2);
    });
  });

  describe("findByUser", () => {
    it("should find all contributions by user", async () => {
      await contributionRepo.createMoneyContribution(
        {
          needId: testNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.MONEY,
          status: ContributionStatus.CONFIRMED,
        },
        {
          amount: 500,
          currency: "NOK",
          paymentStatus: PaymentStatus.COMPLETED,
        }
      );

      await contributionRepo.createMoneyContribution(
        {
          needId: testNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.MONEY,
          status: ContributionStatus.CONFIRMED,
        },
        {
          amount: 1000,
          currency: "NOK",
          paymentStatus: PaymentStatus.COMPLETED,
        }
      );

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
      await contributionRepo.createMoneyContribution(
        {
          needId: testNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.MONEY,
          status: ContributionStatus.CONFIRMED,
        },
        {
          amount: 500,
          currency: "NOK",
          paymentStatus: PaymentStatus.COMPLETED,
        }
      );

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
      const contribution = await contributionRepo.createMoneyContribution(
        {
          needId: testNeed.id,
          userId: testUser.id,
          contributionType: ContributionType.MONEY,
          status: ContributionStatus.PENDING,
        },
        {
          amount: 1000,
          currency: "NOK",
          paymentStatus: PaymentStatus.PENDING,
        }
      );

      const updated = await contributionRepo.updateStatus(
        contribution.id,
        ContributionStatus.CONFIRMED
      );

      expect(updated.status).toBe(ContributionStatus.CONFIRMED);
    });
  });
});