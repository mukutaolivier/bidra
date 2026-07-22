import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import type { Response } from "express";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { clearRefreshCookie, getCookieValue, REFRESH_COOKIE_NAME, setRefreshCookie } from "./auth-cookie";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register new user" })
  @ApiResponse({ status: 201, description: "User registered successfully" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(
    @Body("email") email: string,
    @Body("password") password: string,
    @Body("name") name: string,
    @Body("phone") phone?: string,
    @Body("language") language?: string
  ) {
    return this.authService.register(email, password, name, phone, language);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login with email and password" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(
    @Body("email") email: string,
    @Body("password") password: string,
    @Body("rememberMe") rememberMe?: boolean,
    @Ip() ipAddress?: string,
    @Headers("user-agent") userAgent?: string,
    @Res({ passthrough: true }) response?: Response
  ) {
    const result = await this.authService.login(email, password, rememberMe, ipAddress, userAgent);
    setRefreshCookie(response as Response, result.tokens.refreshToken, result.tokens.refreshTokenExpiresAt);

    return {
      user: result.user,
      accessToken: result.tokens.accessToken,
    };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Refresh access token" })
  @ApiResponse({ status: 200, description: "Token refreshed successfully" })
  @ApiResponse({ status: 401, description: "Invalid refresh token" })
  async refresh(@Request() req: any, @Ip() ipAddress?: string, @Headers("user-agent") userAgent?: string, @Res({ passthrough: true }) response?: Response) {
    const refreshToken = getCookieValue(req.headers?.cookie, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const result = await this.authService.refreshTokens(refreshToken, ipAddress, userAgent);
    setRefreshCookie(response as Response, result.refreshToken, result.refreshTokenExpiresAt);

    return {
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post("logout")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout current session" })
  @ApiResponse({ status: 200, description: "Logged out successfully" })
  async logout(@Request() req: any, @Res({ passthrough: true }) response?: Response) {
    const refreshToken = getCookieValue(req.headers?.cookie, REFRESH_COOKIE_NAME) || undefined;
    const result = await this.authService.logout(req.user.id, req.user.sessionId, refreshToken);
    clearRefreshCookie(response as Response);
    return result;
  }

  @Post("logout-all")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Logout from all devices" })
  @ApiResponse({ status: 200, description: "Logged out from all devices" })
  async logoutAll(@Request() req: any, @Res({ passthrough: true }) response?: Response) {
    const result = await this.authService.logoutAll(req.user.id);
    clearRefreshCookie(response as Response);
    return result;
  }

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Resend email verification link" })
  @ApiResponse({ status: 200, description: "Verification link sent if the account exists" })
  async resendVerification(@Body("email") email: string) {
    return this.authService.resendVerification(email);
  }

  @Get("verify-email")
  @ApiOperation({ summary: "Verify email with token" })
  @ApiResponse({ status: 200, description: "Email verified successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async verifyEmail(@Query("token") token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Request password reset" })
  @ApiResponse({ status: 200, description: "Reset email sent if user exists" })
  async forgotPassword(@Body("email") email: string) {
    return this.authService.requestPasswordReset(email);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reset password with token" })
  @ApiResponse({ status: 200, description: "Password reset successfully" })
  @ApiResponse({ status: 400, description: "Invalid or expired token" })
  async resetPassword(
    @Body("token") token: string,
    @Body("newPassword") newPassword: string
  ) {
    return this.authService.resetPassword(token, newPassword);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  @ApiResponse({ status: 200, description: "User profile retrieved" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req: any) {
    return {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      sessionId: req.user.sessionId,
    };
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "List active sessions" })
  async sessions(@Request() req: any) {
    return this.authService.listSessions(req.user.id);
  }

  @Delete("sessions/:sessionId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke a session" })
  async revokeSession(@Request() req: any, @Param("sessionId") sessionId: string) {
    return this.authService.revokeSession(req.user.id, sessionId, req.user.sessionId);
  }

  @Post("sessions/revoke-others")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Revoke all other sessions" })
  async revokeOtherSessions(@Request() req: any) {
    return this.authService.revokeOtherSessions(req.user.id, req.user.sessionId);
  }
}