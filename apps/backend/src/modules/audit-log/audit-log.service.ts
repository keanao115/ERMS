import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async getAuditLogs(action?: any) {
    return this.prisma.auditLog.findMany({
      where: action ? { action } : {},
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    });
  }
}
