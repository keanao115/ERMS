import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockPrisma: any;
  let mockJwt: any;
  let mockRedis: any;

  beforeEach(() => {
    mockPrisma = {
      user: { findUnique: vi.fn() },
      auditLog: { create: vi.fn() }
    };

    mockJwt = {
      sign: vi.fn().mockReturnValue('mocked_jwt_token'),
      verify: vi.fn()
    };

    mockRedis = {
      set: vi.fn(),
      get: vi.fn()
    };

    service = new AuthService(mockPrisma as any, mockJwt as any, mockRedis as any);
  });

  it('should validate user password and return access & refresh tokens', async () => {
    const hashedPass = await bcrypt.hash('Password123!', 10);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'admin@aura.com',
      passwordHash: hashedPass,
      role: 'SUPER_ADMIN',
      isActive: true,
      branchId: 'branch-1',
      restaurantId: 'rest-1'
    });

    const result = await service.login('admin@aura.com', 'Password123!');
    expect(result.accessToken).toBe('mocked_jwt_token');
    expect(result.user.email).toBe('admin@aura.com');
  });
});
