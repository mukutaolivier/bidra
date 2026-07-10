import { PrismaClient } from "@prisma/client";
import { UserRepository } from "../../repositories/user.repository";
import { UserStatus } from "@prisma/client";
import { EntityNotFoundError } from "../../exceptions";

const prisma = new PrismaClient();
const userRepo = new UserRepository(prisma);

describe("UserRepository", () => {
  let testRole: any;

  beforeAll(async () => {
    await prisma.$connect();
    
    // Create test role
    testRole = await prisma.role.create({
      data: {
        name: "user",
        description: "Test user role",
        isSystem: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.role.deleteMany();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  describe("create", () => {
    it("should create a new user with role", async () => {
      const userData = {
        email: "test@example.no",
        name: "Test User",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      };

      const user = await userRepo.create(userData);

      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.id).toBeDefined();
      expect(user.createdAt).toBeInstanceOf(Date);
    });

    it("should create user with optional fields", async () => {
      const userData = {
        email: "test2@example.no",
        name: "Test User 2",
        phone: "+4741234567",
        language: "en",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      };

      const user = await userRepo.create(userData);

      expect(user.phone).toBe(userData.phone);
    });
  });

  describe("findById", () => {
    it("should find user by id", async () => {
      const created = await userRepo.create({
        email: "find@example.no",
        name: "Find Me",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
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
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
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
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });
      await userRepo.create({
        email: "user2@example.no",
        name: "User 2",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });

      const result = await userRepo.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter by status", async () => {
      await userRepo.create({
        email: "active@example.no",
        name: "Active User",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });
      await userRepo.create({
        email: "suspended@example.no",
        name: "Suspended User",
        language: "no",
        status: UserStatus.SUSPENDED,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });

      const result = await userRepo.findAll({
        page: 1,
        limit: 10,
        where: { status: UserStatus.ACTIVE },
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe(UserStatus.ACTIVE);
    });
  });

  describe("update", () => {
    it("should update user fields", async () => {
      const created = await userRepo.create({
        email: "update@example.no",
        name: "Original Name",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
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
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
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
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });

      await userRepo.delete(created.id);

      const deleted = await prisma.user.findUnique({
        where: { id: created.id },
      });

      expect(deleted?.deletedAt).toBeInstanceOf(Date);
    });
  });

  describe("role management", () => {
    it("should assign role to user", async () => {
      const user = await userRepo.create({
        email: "role@example.no",
        name: "Role User",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });

      await userRepo.assignRole(user.id, testRole.id);

      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: { roles: { include: { role: true } } },
      });

      expect(userWithRoles?.roles).toHaveLength(1);
      expect(userWithRoles?.roles[0].role.name).toBe("user");
    });

    it("should remove role from user", async () => {
      const user = await userRepo.create({
        email: "remove-role@example.no",
        name: "Remove Role User",
        language: "no",
        status: UserStatus.ACTIVE,
        passwordHash: "test_hash",
        emailVerified: true,
        failedLoginAttempts: 0,
      });

      await userRepo.assignRole(user.id, testRole.id);
      await userRepo.removeRole(user.id, testRole.id);

      const userWithRoles = await prisma.user.findUnique({
        where: { id: user.id },
        include: { roles: true },
      });

      expect(userWithRoles?.roles).toHaveLength(0);
    });
  });
});