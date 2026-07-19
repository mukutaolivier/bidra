import { describe, expect, it, vi, beforeEach } from "vitest";
import { RefreshTokenRepository } from "../../repositories/refresh-token.repository";

describe("RefreshTokenRepository unit", () => {
  const prisma = {
    refreshToken: {
      updateMany: vi.fn(),
      findMany: vi.fn(),
    },
  } as any;

  const repository = new RefreshTokenRepository(prisma);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokeAllForUser sets revokedAt and provided reason", async () => {
    prisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    const count = await repository.revokeAllForUser("user-1", "logout_all");

    expect(count).toBe(3);
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
        revokedReason: "logout_all",
      },
    });
  });

  it("findActiveByUserId requests non-revoked and non-expired tokens", async () => {
    prisma.refreshToken.findMany.mockResolvedValue([]);

    await repository.findActiveByUserId("user-2");

    expect(prisma.refreshToken.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-2",
        revokedAt: null,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      orderBy: { createdAt: "desc" },
    });
  });
});
