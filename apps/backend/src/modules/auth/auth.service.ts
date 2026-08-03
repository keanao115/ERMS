import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  public static readonly SERVER_BOOT_ID = uuidv4();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService
  ) {}

  async login(email: string, pass: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { branch: true, restaurant: true }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials or user account disabled');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const jti = uuidv4();
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branchId,
      restaurantId: user.restaurantId,
      jti
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '1d' });
    const refreshToken = this.jwtService.sign(
      { sub: user.id, jti: uuidv4() },
      { expiresIn: '7d' }
    );

    // Record login audit
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        userRole: user.role,
        action: 'LOGIN',
        entityName: 'User',
        entityId: user.id,
        payload: JSON.stringify({ email: user.email })
      }
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        branchId: user.branchId,
        restaurantId: user.restaurantId,
        branchName: user.branch?.name
      },
      accessToken,
      refreshToken,
      serverBootId: AuthService.SERVER_BOOT_ID
    };
  }

  async refreshAccessToken(refreshTokenStr: string) {
    try {
      const payload = this.jwtService.verify(refreshTokenStr);
      const isBlacklisted = await this.redisService.get(`auth:token_blacklist:${payload.jti}`);
      if (isBlacklisted) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub }
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException('User account inactive or missing');
      }

      const newJti = uuidv4();
      const newAccessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
        role: user.role,
        branchId: user.branchId,
        restaurantId: user.restaurantId,
        jti: newJti
      }, { expiresIn: '1d' });

      const newRefreshToken = this.jwtService.sign(
        { sub: user.id, jti: uuidv4() },
        { expiresIn: '7d' }
      );

      await this.redisService.set(`auth:token_blacklist:${payload.jti}`, 'true', 86400 * 7);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        serverBootId: AuthService.SERVER_BOOT_ID
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  getServerInstance() {
    return { serverBootId: AuthService.SERVER_BOOT_ID };
  }

  async logout(jti: string) {
    if (jti) {
      await this.redisService.set(`auth:token_blacklist:${jti}`, 'true', 86400);
    }
    return { success: true, message: 'Logged out successfully' };
  }
}
