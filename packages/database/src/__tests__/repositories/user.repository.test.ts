import { PrismaClient } from "@prisma/client";
import { UserRepository } from "../../repositories/user.repository";
import { UserRole, UserStatus } from "@prisma/client";
import { EntityNotFoundError } from "../../exceptions";

const prisma = new PrismaClient();
const userRepo = new UserRepository(prisma);

describe("UserRepository", () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany();
  });

  describe("create", () => {
    it("should create a new user", async () => {
      const userData = {
        email: "test@example.no",
        name: "Test User",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      };

      const user = await userRepo.create(userData);

      expect(user).toMatchObject(userData);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("should create user with optional fields", async () => {
      const userData = {
        email: "test2@example.no",
        name: "Test User 2",
        phone: "+4741234567",
        language: "en",
        role: UserRole.ORG_ADMIN,
        status: UserStatus.ACTIVE,
      };

      const user = await userRepo.create(userData);

      expect(user.phone).toBe(userData.phone);
      expect(user.role).toBe(UserRole.ORG_ADMIN);
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const created = await userRepo.create({
        email: "find@example.no",
        name: "Find Me",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      const found = await userRepo.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        email: created.email,
        name: created.name,
      });
    });

    it("should throw EntityNotFoundError for non-existent id", async () => {
      await expect(
        userRepo.findById("non-existent-id")
      ).rejects.toThrow(EntityNotFoundError);
    });
  });

  describe("findByEmail", () => {
    it("should find user by email", async () => {
      const created = await userRepo.create({
        email: "unique@example.no",
        name: "Unique User",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      const found = await userRepo.findByEmail(created.email);

      expect(found).toMatchObject({
        email: created.email,
        name: created.name,
      });
    });

    it("should return null for non-existent email", async () => {
      const found = await userRepo.findByEmail("nonexistent@example.no");
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    it("should return paginated users", async () => {
      await userRepo.create({
        email: "user1@example.no",
        name: "User 1",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });
      await userRepo.create({
        email: "user2@example.no",
        name: "User 2",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      const result = await userRepo.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter by role", async () => {
      await userRepo.create({
        email: "admin@example.no",
        name: "Admin",
        language: "no",
        role: UserRole.PLATFORM_ADMIN,
        status: UserStatus.ACTIVE,
      });
      await userRepo.create({
        email: "user@example.no",
        name: "User",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      const result = await userRepo.findAll({
        page: 1,
        limit: 10,
        where: { role: UserRole.PLATFORM_ADMIN },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe(UserRole.PLATFORM_ADMIN);
    });
  });

  describe("update", () => {
    it("should update user fields", async () => {
      const created = await userRepo.create({
        email: "update@example.no",
        name: "Original Name",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      const updated = await userRepo.update(created.id, {
        name: "Updated Name",
        phone: "+4741234567",
      });

      expect(updated.name).toBe("Updated Name");
      expect(updated.phone).toBe("+4741234567");
      expect(updated.email).toBe(created.email);
    });
  });

  describe("updateStatus", () => {
    it("should update user status", async () => {
      const created = await userRepo.create({
        email: "status@example.no",
        name: "Status User",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      const updated = await userRepo.updateStatus(created.id, UserStatus.SUSPENDED);

      expect(updated.status).toBe(UserStatus.SUSPENDED);
    });
  });

  describe("delete (soft delete)", () => {
    it("should soft delete user", async () => {
      const created = await userRepo.create({
        email: "delete@example.no",
        name: "Delete Me",
        language: "no",
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
      });

      await userRepo.delete(created.id);

      const deleted = await prisma.user.findUnique({
        where: { id: created.id },
      });

      expect(deleted?.deletedAt).toBeInstanceOf(Date);
    });
  });
});