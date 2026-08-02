# Enterprise Security Architecture & Compliance

1. **JWT Revocation**: Every JWT contains a unique `jti`. Logout or security revocation instantly writes `auth:token_blacklist:<jti>` to Redis.
2. **Role-Based Access Control (RBAC)**: Fine-grained `@Roles()` decorator enforced on NestJS controller endpoints via `RolesGuard`.
3. **SQL Injection Defense**: 100% parameterization guaranteed by Prisma ORM compile-time query builder.
4. **XSS & CSRF Mitigation**: Strict CSP security headers enforced via Helmet, Zod DTO input validation.
5. **Security Audit Log**: Immutable record of all write/update/delete actions with user ID, role, IP address, and correlation `traceId`.
