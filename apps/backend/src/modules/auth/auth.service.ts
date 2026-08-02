import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
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
      refreshToken
    };
  }

  async logout(jti: string) {
    if (jti) {
      // Blacklist token in Redis for 1 day
      await this.redisService.set(`auth:token_blacklist:${jti}`, 'true', 86400);
    }
    return { success: true, message: 'Logged out successfully' };
  }
}
