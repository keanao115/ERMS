import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class TenantIsolationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true; // Rely on JwtAuthGuard for authentication check
    }

    // Super Admin has global multi-tenant access across all restaurants & branches
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.RESTAURANT_OWNER) {
      return true;
    }

    const requestedBranchId =
      request.query?.branchId ||
      request.body?.branchId ||
      request.params?.branchId;

    if (requestedBranchId && user.branchId && requestedBranchId !== user.branchId) {
      throw new ForbiddenException(
        `Multi-Tenant Data Isolation Guard Violation: Access to branch '${requestedBranchId}' is forbidden for user bound to branch '${user.branchId}'.`
      );
    }

    return true;
  }
}
