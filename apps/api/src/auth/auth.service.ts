import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaClient, UserStatus } from "@prisma/client";
import * as argon2 from "argon2";
import { createHash, randomBytes } from "crypto";
import {
  UserRepository,
  RefreshTokenRepository,
  AuditLogRepository,
} from "@bidra/database";

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly refreshTokenRepository: RefreshTokenRepository;
  private readonly auditLogRepository: AuditLogRepository;
  private readonly maxFailedAttempts = 5;
  private readonly lockoutDuration = 30 * 60 * 1000; // 30 minutes

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.userRepository = new UserRepository(prisma);
    this.refreshTokenRepository = new RefreshTokenRepository(prisma);
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
      status: UserStatus.ACTIVE,
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

    console.log(`[EMAIL] Verification link: /verify-email?token=${emailVerificationToken}`);

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

    const tokens = await this.generateTokens(user.id, user.email, primaryRole, rememberMe);

    const refreshTokenExpiry = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: refreshTokenExpiry,
      userAgent,
      ipAddress,
      revokedAt: null,
      replacedBy: null,
      revokedReason: null,
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
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
    const hashedToken = this.hashToken(refreshToken);

    const tokenRecord = await this.refreshTokenRepository.findByToken(hashedToken);

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    const user = await this.userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const userRoles = user.roles?.map(ur => ur.role.name) || [];
    const primaryRole = userRoles[0] || "user";

    const newTokens = await this.generateTokens(user.id, user.email, primaryRole);

    await this.refreshTokenRepository.revoke(tokenRecord.id, "rotation");

    const newHashedRefreshToken = this.hashToken(newTokens.refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: newHashedRefreshToken,
      expiresAt: refreshTokenExpiry,
      userAgent,
      ipAddress,
      revokedAt: null,
      replacedBy: null,
      revokedReason: null,
    });

    return newTokens;
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hashedToken = this.hashToken(refreshToken);
      try {
        await this.refreshTokenRepository.revokeByToken(hashedToken, "logout");
      } catch (error) {
        // Token might not exist, ignore
      }
    }

    await this.auditLogRepository.logAuthEvent("LOGOUT", userId, "success");

    return { message: "Logged out successfully" };
  }

  /**
   * Logout from all devices
   */
  async logoutAll(userId: string) {
    await this.refreshTokenRepository.revokeAllForUser(userId, "logout");
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

    console.log(`[EMAIL] Password reset link: /reset-password?token=${passwordResetToken}`);

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

    await this.refreshTokenRepository.revokeAllForUser(user.id, "password_change");

    await this.auditLogRepository.logAuthEvent("PASSWORD_RESET", user.id, "success");

    return { message: "Password reset successfully" };
  }

  /**
   * Validate user by ID
   */
  async validateUser(userId: string) {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User account is not active");
    }

    return user;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    rememberMe: boolean = false
  ) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenExpiration = rememberMe ? "30d" : "7d";
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>("JWT_REFRESH_SECRET"),
      expiresIn: refreshTokenExpiration,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

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