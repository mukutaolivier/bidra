import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import {
  UserRepository,
  AuditLogRepository,
} from "@bidra/database";

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly auditLogRepository: AuditLogRepository;
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDuration = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.userRepository = new UserRepository(prisma);
    this.auditLogRepository = new AuditLogRepository(prisma);
  }

  /**
   * Register new user
   */
  async register(
    email: string,
    password: string,
    name: string,
    phone?: string,
    language: string = "no"
  ) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    this.validatePassword(password);

    const passwordHash = await this.hashPassword(password);

    const emailVerificationToken = this.generateToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = await this.userRepository.create({
      email,
      passwordHash,
      name,
      phone,
      language,
      status: "ACTIVE",
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry,
      failedLoginAttempts: 0,
      passwordHistory: null,
      accountLockedUntil: null,
      lastLoginAt: null,
      lastLoginIp: null,
      passwordResetToken: null,
      passwordResetExpiry: null,
      deletedAt: null,
    });

    await this.auditLogRepository.logAuthEvent(
      "REGISTER",
      user.id,
      "success",
      undefined,
      undefined,
      { email }
    );

    console.log("[EMAIL] Verification link generated for new account");

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
    };
  }

  /**
   * Login user with email and password
   */
  async login(
    email: string,
    password: string,
    rememberMe: boolean = false,
    ipAddress?: string,
    userAgent?: string
  ) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      await this.auditLogRepository.logAuthEvent(
        "LOGIN",
        null,
        "failure",
        ipAddress,
        userAgent,
        { email, reason: "user_not_found" }
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${remainingTime} minutes.`
      );
    }

    const isPasswordValid = await this.verifyPassword(password, user.passwordHash || "");

    if (!isPasswordValid) {
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newFailedAttempts };

      if (newFailedAttempts >= this.maxFailedAttempts) {
        updates.accountLockedUntil = new Date(Date.now() + this.lockoutDuration);
        await this.auditLogRepository.logAuthEvent(
          "ACCOUNT_LOCKED",
          user.id,
          "success",
          ipAddress,
          userAgent,
          { reason: "max_failed_attempts" }
        );
      }

      await this.userRepository.update(user.id, updates);

      await this.auditLogRepository.logAuthEvent(
        "LOGIN",
        user.id,
        "failure",
        ipAddress,
        userAgent,
        { reason: "invalid_password" }
      );

      throw new UnauthorizedException("Invalid credentials");
    }

    if (!user.emailVerified) {
      console.warn(`[AUTH] User ${user.email} logging in with unverified email`);
    }

    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLoginAt: new Date(),
    });

    const userRoles = user.roles?.map(ur => ur.role.name) || [];
    const primaryRole = userRoles[0] || "user";

    const refreshTokenExpiresAt = this.getRefreshTokenExpiry(rememberMe);
    const session = await prisma.$transaction(async (transaction) => {
      const createdSession = await transaction.userSession.create({
        data: {
          userId: user.id,
          token: this.hashToken(this.generateToken()),
          userAgent,
          ipAddress,
          deviceName: this.getDeviceName(userAgent),
          createdAt: new Date(),
          lastActivityAt: new Date(),
          expiresAt: refreshTokenExpiresAt,
          revokedAt: null,
          revokedReason: null,
        },
      });

      const rawRefreshToken = await this.generateRefreshToken(user.id, user.email, primaryRole, createdSession.id, refreshTokenExpiresAt);
      const hashedRefreshToken = this.hashToken(rawRefreshToken);

      const createdRefreshToken = await transaction.refreshToken.create({
        data: {
          userId: user.id,
          sessionId: createdSession.id,
          token: hashedRefreshToken,
          expiresAt: refreshTokenExpiresAt,
          userAgent,
          ipAddress,
          revokedAt: null,
          replacedBy: null,
          revokedReason: null,
        },
      });

      await transaction.userSession.update({
        where: { id: createdSession.id },
        data: {
          refreshTokenId: createdRefreshToken.id,
        },
      });

      return {
        sessionId: createdSession.id,
        accessToken: this.generateAccessToken(user.id, user.email, primaryRole, createdSession.id),
        refreshToken: rawRefreshToken,
        refreshTokenExpiresAt,
      };
    });

    await this.auditLogRepository.logAuthEvent(
      "LOGIN",
      user.id,
      "success",
      ipAddress,
      userAgent,
      { method: "email_password" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: userRoles,
        emailVerified: user.emailVerified,
        sessionId: session.sessionId,
      },
      tokens: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        refreshTokenExpiresAt: session.refreshTokenExpiresAt,
      },
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const hashedToken = this.hashToken(refreshToken);

    const result = await prisma.$transaction(async (transaction) => {
      const tokenRecord = await transaction.refreshToken.findUnique({
        where: { token: hashedToken },
        include: {
          session: true,
          user: true,
        },
      });

      if (!tokenRecord || !tokenRecord.session) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      if (tokenRecord.session.revokedAt) {
        throw new UnauthorizedException("Invalid refresh token");
      }

      if (tokenRecord.expiresAt < new Date()) {
        await this.revokeSessionFamily(transaction, tokenRecord.sessionId, "expired_token");
        throw new UnauthorizedException("Invalid refresh token");
      }

      const tokenRevocation = await transaction.refreshToken.updateMany({
        where: {
          id: tokenRecord.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "rotation",
        },
      });

      if (tokenRevocation.count !== 1) {
        await this.revokeSessionFamily(transaction, tokenRecord.sessionId, "reuse_detected");
        throw new UnauthorizedException("Invalid refresh token");
      }

      const user = tokenRecord.user;
      const userRoles = user.roles?.map((ur) => ur.role.name) || [];
      const primaryRole = userRoles[0] || "user";
      const sessionExpiresAt = tokenRecord.session.expiresAt;
      const secondsRemaining = Math.max(
        60,
        Math.floor((sessionExpiresAt.getTime() - Date.now()) / 1000)
      );

      const newRefreshToken = await this.generateRefreshToken(
        user.id,
        user.email,
        primaryRole,
        tokenRecord.sessionId,
        sessionExpiresAt
      );

      const newHashedRefreshToken = this.hashToken(newRefreshToken);

      const createdRefreshToken = await transaction.refreshToken.create({
        data: {
          userId: user.id,
          sessionId: tokenRecord.sessionId,
          token: newHashedRefreshToken,
          expiresAt: sessionExpiresAt,
          userAgent,
          ipAddress,
          revokedAt: null,
          replacedBy: null,
          revokedReason: null,
        },
      });

      await transaction.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          replacedBy: createdRefreshToken.id,
        },
      });

      await transaction.userSession.update({
        where: { id: tokenRecord.sessionId },
        data: {
          refreshTokenId: createdRefreshToken.id,
          lastActivityAt: new Date(),
          reuseDetectedAt: null,
          revokedAt: null,
          revokedReason: null,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: userRoles,
          emailVerified: user.emailVerified,
          sessionId: tokenRecord.sessionId,
        },
        accessToken: this.generateAccessToken(user.id, user.email, primaryRole, tokenRecord.sessionId),
        refreshToken: newRefreshToken,
        refreshTokenExpiresAt: sessionExpiresAt,
        sessionId: tokenRecord.sessionId,
        secondsRemaining,
      };
    });

    await this.auditLogRepository.logAuthEvent(
      "TOKEN_REFRESH",
      result.user.id,
      "success",
      ipAddress,
      userAgent,
      { sessionId: result.sessionId }
    );

    return result;
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId?: string, refreshToken?: string) {
    if (sessionId) {
      await prisma.$transaction(async (transaction) => {
        await this.revokeSessionFamily(transaction, sessionId, "logout");
      });
    } else if (refreshToken) {
      const hashedToken = this.hashToken(refreshToken);
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: hashedToken },
        include: { session: true },
      });

      if (tokenRecord?.sessionId) {
        await prisma.$transaction(async (transaction) => {
          await this.revokeSessionFamily(transaction, tokenRecord.sessionId, "logout");
        });
      }
    }

    await this.auditLogRepository.logAuthEvent("LOGOUT", userId, "success");

    return { message: "Logged out successfully" };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string) {
    await prisma.$transaction(async (transaction) => {
      await transaction.refreshToken.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "logout",
        },
      });

      await transaction.userSession.updateMany({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "logout",
        },
      });
    });

    await this.auditLogRepository.logAuthEvent("LOGOUT_ALL", userId, "success");
    return { message: "Logged out from all devices" };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const user = await this.userRepository.findByEmailVerificationToken(token);

    if (!user) {
      throw new BadRequestException("Invalid verification token");
    }

    if (!user.emailVerificationExpiry || user.emailVerificationExpiry < new Date()) {
      throw new BadRequestException("Verification token has expired");
    }

    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    });

    await this.auditLogRepository.logAuthEvent("EMAIL_VERIFICATION", user.id, "success");

    return { message: "Email verified successfully" };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return { message: "If the email exists, a reset link has been sent" };
    }

    const passwordResetToken = this.generateToken();
    const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await this.userRepository.update(user.id, {
      passwordResetToken,
      passwordResetExpiry,
    });

    console.log("[EMAIL] Password reset link generated");

    await this.auditLogRepository.logAuthEvent("PASSWORD_RESET_REQUEST", user.id, "success");

    return { message: "If the email exists, a reset link has been sent" };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (!user) {
      throw new BadRequestException("Invalid reset token");
    }

    if (!user.passwordResetExpiry || user.passwordResetExpiry < new Date()) {
      throw new BadRequestException("Reset token has expired");
    }

    this.validatePassword(newPassword);

    if (user.passwordHistory) {
      const passwordHistory = user.passwordHistory as string[];
      for (const oldHash of passwordHistory) {
        const isSamePassword = await this.verifyPassword(newPassword, oldHash);
        if (isSamePassword) {
          throw new BadRequestException("Cannot reuse recent passwords");
        }
      }
    }

    const passwordHash = await this.hashPassword(newPassword);

    const passwordHistory = user.passwordHistory
      ? (user.passwordHistory as string[]).slice(-4)
      : [];
    if (user.passwordHash) {
      passwordHistory.push(user.passwordHash);
    }

    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      passwordHistory,
    });

    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: "password_change",
      },
    });

    await this.auditLogRepository.logAuthEvent("PASSWORD_RESET", user.id, "success");

    return { message: "Password reset successfully" };
  }

  async resendVerification(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user || user.emailVerified) {
      return { message: "If the email exists, a verification link has been sent" };
    }

    const emailVerificationToken = this.generateToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.userRepository.update(user.id, {
      emailVerificationToken,
      emailVerificationExpiry,
    });

    console.log("[EMAIL] Verification link regenerated");

    await this.auditLogRepository.logAuthEvent("EMAIL_VERIFICATION_REQUEST", user.id, "success");

    return { message: "If the email exists, a verification link has been sent" };
  }

  async listSessions(userId: string) {
    return prisma.userSession.findMany({
      where: {
        userId,
      },
      include: {
        refreshToken: true,
      },
      orderBy: {
        lastActivityAt: "desc",
      },
    });
  }

  async revokeSession(userId: string, sessionId: string, currentSessionId?: string) {
    const session = await prisma.userSession.findFirst({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!session) {
      return { message: "Session revoked" };
    }

    await prisma.$transaction(async (transaction) => {
      await this.revokeSessionFamily(transaction, session.id, "user_logout");
    });

    if (currentSessionId && currentSessionId === sessionId) {
      return { message: "Current session revoked" };
    }

    return { message: "Session revoked" };
  }

  async revokeOtherSessions(userId: string, currentSessionId: string) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
        revokedAt: null,
      },
      select: {
        id: true,
      },
    });

    await prisma.$transaction(async (transaction) => {
      for (const session of sessions) {
        await this.revokeSessionFamily(transaction, session.id, "logout_other_sessions");
      }
    });

    return { message: "Other sessions revoked", count: sessions.length };
  }

  /**
   * Validate user by ID
   */
  async validateUser(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedException("User account is not active");
    }

    return user;
  }

  private generateAccessToken(userId: string, email: string, role: string, sessionId: string): string {
    return this.jwtService.sign({
      sub: userId,
      email,
      role,
      sid: sessionId,
    });
  }

  private async generateRefreshToken(
    userId: string,
    email: string,
    role: string,
    sessionId: string,
    expiresAt: Date
  ): Promise<string> {
    const expiresInSeconds = Math.max(60, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    return this.jwtService.sign(
      {
        sub: userId,
        email,
        role,
        sid: sessionId,
      },
      {
        secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: expiresInSeconds,
      }
    );
  }

  private getRefreshTokenExpiry(rememberMe: boolean): Date {
    return rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  private getDeviceName(userAgent?: string): string | null {
    if (!userAgent) {
      return null;
    }

    if (userAgent.includes("Mobile")) {
      return "Mobile browser";
    }

    if (userAgent.includes("Chrome")) {
      return "Chrome browser";
    }

    if (userAgent.includes("Firefox")) {
      return "Firefox browser";
    }

    if (userAgent.includes("Safari")) {
      return "Safari browser";
    }

    return "Desktop browser";
  }

  private async revokeSessionFamily(
    transaction: typeof prisma,
    sessionId: string,
    reason: string
  ): Promise<void> {
    const now = new Date();

    await transaction.refreshToken.updateMany({
      where: {
        sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokedReason: reason,
      },
    });

    await transaction.userSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: now,
        revokedReason: reason,
        reuseDetectedAt: reason === "reuse_detected" ? now : undefined,
      },
    });
  }

  /**
   * Generate JWT tokens
   */
  /**
   * Hash password using Argon2id
   */
  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  /**
   * Verify password using Argon2id
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Generate secure random token
   */
  private generateToken(length: number = 32): string {
    return randomBytes(length).toString("hex");
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException("Password must be at least 8 characters long");
    }

    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException("Password must contain at least one uppercase letter");
    }

    if (!/[a-z]/.test(password)) {
      throw new BadRequestException("Password must contain at least one lowercase letter");
    }

    if (!/[0-9]/.test(password)) {
      throw new BadRequestException("Password must contain at least one number");
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new BadRequestException("Password must contain at least one special character");
    }
  }
}