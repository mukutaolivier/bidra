import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";
import {
  UserRepository,
  RefreshTokenRepository,
  AuditLogRepository,
} from "@bidra/database";
import { UserRole } from "@bidra/types";

@Injectable()
export class AuthService {
  private readonly userRepository: UserRepository;
  private readonly refreshTokenRepository: RefreshTokenRepository;
  private readonly auditLogRepository: AuditLogRepository;
  private readonly saltRounds = 12;
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
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Validate password strength
    this.validatePassword(password);

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Generate email verification token
    const emailVerificationToken = this.generateToken();
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await this.userRepository.create({
      email,
      passwordHash,
      name,
      phone,
      language,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry,
      failedLoginAttempts: 0,
    });

    // Log registration
    await this.auditLogRepository.logAuthEvent(
      "REGISTER",
      user.id,
      true,
      undefined,
      undefined,
      { email }
    );

    // TODO: Send verification email (Package 5)
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
    // Find user by email
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Log failed login attempt
      await this.auditLogRepository.logAuthEvent(
        "LOGIN",
        null,
        false,
        ipAddress,
        userAgent,
        { email, reason: "user_not_found" }
      );
      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if account is locked
    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      const remainingTime = Math.ceil(
        (user.accountLockedUntil.getTime() - Date.now()) / 1000 / 60
      );
      throw new UnauthorizedException(
        `Account locked. Try again in ${remainingTime} minutes.`
      );
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash || "");

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      const updates: any = { failedLoginAttempts: newFailedAttempts };

      // Lock account if max attempts reached
      if (newFailedAttempts >= this.maxFailedAttempts) {
        updates.accountLockedUntil = new Date(Date.now() + this.lockoutDuration);
        await this.auditLogRepository.logAuthEvent(
          "ACCOUNT_LOCKED",
          user.id,
          true,
          ipAddress,
          userAgent,
          { reason: "max_failed_attempts" }
        );
      }

      await this.userRepository.update(user.id, updates);

      // Log failed login
      await this.auditLogRepository.logAuthEvent(
        "LOGIN",
        user.id,
        false,
        ipAddress,
        userAgent,
        { reason: "invalid_password" }
      );

      throw new UnauthorizedException("Invalid credentials");
    }

    // Check if email is verified (optional enforcement)
    if (!user.emailVerified) {
      // For now, just warn - can be enforced later
      console.warn(`[AUTH] User ${user.email} logging in with unverified email`);
    }

    // Reset failed login attempts and update last login
    await this.userRepository.update(user.id, {
      failedLoginAttempts: 0,
      accountLockedUntil: null,
      lastLoginAt: new Date(),
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role, rememberMe);

    // Store refresh token
    const refreshTokenExpiry = rememberMe
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const hashedRefreshToken = await this.hashToken(tokens.refreshToken);

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: hashedRefreshToken,
      expiresAt: refreshTokenExpiry,
      userAgent,
      ipAddress,
    });

    // Log successful login
    await this.auditLogRepository.logAuthEvent(
      "LOGIN",
      user.id,
      true,
      ipAddress,
      userAgent,
      { method: "email_password" }
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshTokens(refreshToken: string, ipAddress?: string, userAgent?: string) {
    // Hash the incoming token to compare with stored hash
    const hashedToken = await this.hashToken(refreshToken);

    // Find refresh token in database
    const tokenRecord = await this.refreshTokenRepository.findByToken(hashedToken);

    if (!tokenRecord) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    // Check if token is revoked
    if (tokenRecord.revokedAt) {
      throw new UnauthorizedException("Refresh token has been revoked");
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException("Refresh token has expired");
    }

    // Get user
    const user = await this.userRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Generate new tokens
    const newTokens = await this.generateTokens(user.id, user.email, user.role);

    // Revoke old refresh token and store new one
    await this.refreshTokenRepository.revoke(tokenRecord.id);

    const newHashedRefreshToken = await this.hashToken(newTokens.refreshToken);
    const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.refreshTokenRepository.create({
      userId: user.id,
      token: newHashedRefreshToken,
      expiresAt: refreshTokenExpiry,
      userAgent,
      ipAddress,
    });

    return newTokens;
  }

  /**
   * Logout user (revoke refresh token)
   */
  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const hashedToken = await this.hashToken(refreshToken);
      try {
        await this.refreshTokenRepository.revokeByToken(hashedToken);
      } catch (error) {
        // Token might not exist, ignore
      }
    }

    // Log logout
    await this.auditLogRepository.logAuthEvent("LOGOUT", userId, true);

    return { message: "Logged out successfully" };
  }

  /**
   * Logout from all devices (revoke all refresh tokens)
   */
  async logoutAll(userId: string) {
    await this.refreshTokenRepository.revokeAllForUser(userId);
    await this.auditLogRepository.logAuthEvent("LOGOUT_ALL", userId, true);
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

    // Update user
    await this.userRepository.update(user.id, {
      emailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpiry: null,
    });

    // Log verification
    await this.auditLogRepository.logAuthEvent("EMAIL_VERIFICATION", user.id, true);

    return { message: "Email verified successfully" };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      // Don't reveal if email exists
      return { message: "If the email exists, a reset link has been sent" };
    }

    // Generate password reset token
    const passwordResetToken = this.generateToken();
    const passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.userRepository.update(user.id, {
      passwordResetToken,
      passwordResetExpiry,
    });

    // TODO: Send password reset email (Package 5)
    console.log(`[EMAIL] Password reset link: /reset-password?token=${passwordResetToken}`);

    // Log password reset request
    await this.auditLogRepository.logAuthEvent("PASSWORD_RESET_REQUEST", user.id, true);

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

    // Validate new password
    this.validatePassword(newPassword);

    // Check password history (prevent reuse of last 5 passwords)
    if (user.passwordHistory) {
      const passwordHistory = user.passwordHistory as string[];
      for (const oldHash of passwordHistory) {
        const isSamePassword = await this.verifyPassword(newPassword, oldHash);
        if (isSamePassword) {
          throw new BadRequestException("Cannot reuse recent passwords");
        }
      }
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password history
    const passwordHistory = user.passwordHistory
      ? (user.passwordHistory as string[]).slice(-4)
      : [];
    if (user.passwordHash) {
      passwordHistory.push(user.passwordHash);
    }

    // Update user
    await this.userRepository.update(user.id, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpiry: null,
      passwordHistory,
    });

    // Revoke all refresh tokens (force re-login)
    await this.refreshTokenRepository.revokeAllForUser(user.id);

    // Log password reset
    await this.auditLogRepository.logAuthEvent("PASSWORD_RESET", user.id, true);

    return { message: "Password reset successfully" };
  }

  /**
   * Validate user by ID (for JWT strategy)
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
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: UserRole,
    rememberMe: boolean = false
  ) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwtService.sign(payload);

    // Refresh token with longer expiration
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
   * Hash a password using Argon2id
   */
  private async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456, // 19 MiB
      timeCost: 2,
      parallelism: 1,
    });
  }

  /**
   * Verify a password against its hash using Argon2id
   */
  private async verifyPassword(
    password: string,
    hash: string
  ): Promise<boolean> {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  private generateToken(length: number = 32): string {
    return randomBytes(length).toString("hex");
  }

  /**
   * Hash a refresh token for storage
   */
  private async hashRefreshToken(token: string): Promise<string> {
    return argon2.hash(token, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  /**
   * Hash token (refresh tokens stored hashed)
   */
  private async hashToken(token: string): Promise<string> {
    return crypto.createHash("sha256").update(token).digest("hex");
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