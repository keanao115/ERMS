import { Controller, Post, Get, Body, UseGuards, Req, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { LoginSchema, RefreshTokenSchema } from '@erms/shared';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Get backend server boot instance ID' })
  @Get('instance')
  async getInstance() {
    return this.authService.getServerInstance();
  }

  @ApiOperation({ summary: 'Login credentials with Zod payload validation' })
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  @ApiOperation({ summary: 'Refresh expired access token' })
  @Post('refresh')
  @UsePipes(new ZodValidationPipe(RefreshTokenSchema))
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @ApiOperation({ summary: 'Logout and revoke JWT token' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    const jti = req.user?.jti;
    return this.authService.logout(jti);
  }

  @ApiOperation({ summary: 'One-click database initialization seed' })
  @Get('seed')
  async triggerSeed() {
    return this.authService.seedIfEmpty();
  }
}

