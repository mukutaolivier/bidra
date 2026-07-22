import { PrismaClient } from "@prisma/client";
import { OrganizationType, VerificationStatus, OrganizationStatus } from "@bidra/types/src/domain/enums";
import { OrganizationRepository } from "../../repositories/organization.repository";

const prisma = new PrismaClient();
const orgRepo = new OrganizationRepository(prisma);

describe("OrganizationRepository", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.organization.deleteMany();
  });

  describe("create", () => {
    it("should create a new organization", async () => {
      const orgData = {
        name: "Test Org",
        organizationNumber: "123456789",
        type: OrganizationType.CHARITY,
        description: "Test description",
        email: "test@org.no",
        phone: "+4722000000",
        city: "Oslo",
        verificationStatus: VerificationStatus.PENDING,
        status: OrganizationStatus.ACTIVE,
      };

      const org = await orgRepo.create(orgData);

      expect(org).toMatchObject(orgData);
      expect(org.id).toBeDefined();
    });
  });

  describe("findByOrganizationNumber", () => {
    it("should find organization by number", async () => {
      await orgRepo.create({
        name: "Unique Org",
        organizationNumber: "987654321",
        type: OrganizationType.CHARITY,
        email: "unique@org.no",
        city: "Bergen",
        verificationStatus: VerificationStatus.PENDING,
        status: OrganizationStatus.ACTIVE,
      });

      const found = await orgRepo.findByOrganizationNumber("987654321");

      expect(found).toMatchObject({
        organizationNumber: "987654321",
        name: "Unique Org",
      });
    });
  });

  describe("findVerified", () => {
    it("should return only verified organizations", async () => {
      await orgRepo.create({
        name: "Verified Org",
        organizationNumber: "111111111",
        type: OrganizationType.CHARITY,
        email: "verified@org.no",
        city: "Oslo",
        verificationStatus: VerificationStatus.VERIFIED,
        verificationDate: new Date(),
        status: OrganizationStatus.ACTIVE,
      });

      await orgRepo.create({
        name: "Pending Org",
        organizationNumber: "222222222",
        type: OrganizationType.CHARITY,
        email: "pending@org.no",
        city: "Oslo",
        verificationStatus: VerificationStatus.PENDING,
        status: OrganizationStatus.ACTIVE,
      });

      const result = await orgRepo.findVerified({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].verificationStatus).toBe(VerificationStatus.VERIFIED);
    });
  });

  describe("updateVerificationStatus", () => {
    it("should update verification status and set date", async () => {
      const created = await orgRepo.create({
        name: "Verify Me",
        organizationNumber: "333333333",
        type: OrganizationType.CHARITY,
        email: "verify@org.no",
        city: "Oslo",
        verificationStatus: VerificationStatus.PENDING,
        status: OrganizationStatus.ACTIVE,
      });

      const updated = await orgRepo.updateVerificationStatus(
        created.id,
        VerificationStatus.VERIFIED
      );

      expect(updated.verificationStatus).toBe(VerificationStatus.VERIFIED);
      expect(updated.verificationDate).toBeInstanceOf(Date);
    });
  });
});