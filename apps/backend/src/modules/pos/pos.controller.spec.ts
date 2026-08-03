import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { KdsController } from '../kds/kds.controller';
import { KdsService } from '../kds/kds.service';
import { ValidationPipe, INestApplication } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { TenantIsolationGuard } from '../../common/guards/tenant-isolation.guard';

describe('Real NestJS Server Pipe Execution Test for Zod Routes', () => {
  let app: INestApplication;
  let serverUrl: string;

  beforeEach(async () => {
    const posServiceMock = {
      voidOrder: vi.fn().mockImplementation((id: string, actor: any, reason: string) => Promise.resolve({ id, status: 'CANCELLED', reason, actor })),
      refundOrder: vi.fn().mockImplementation((id: string, actor: any, reason: string) => Promise.resolve({ id, status: 'REFUNDED', reason, actor })),
      appendItemsToOrder: vi.fn().mockImplementation((id: string, items: any[]) => Promise.resolve({ id, items })),
      getActiveOrderForTable: vi.fn().mockImplementation((id: string) => Promise.resolve({ id })),
      createOrder: vi.fn(),
      getOrders: vi.fn(),
      settlePayment: vi.fn()
    };

    const kdsServiceMock = {
      getStationQueue: vi.fn().mockResolvedValue([])
    };

    const mockUser = { id: 'usr-1', email: 'manager@erms.com', role: 'STORE_MANAGER', firstName: 'John', lastName: 'Doe' };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [PosController, KdsController],
      providers: [
        { provide: PosService, useValue: posServiceMock },
        { provide: KdsService, useValue: kdsServiceMock }
      ]
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: (ctx: any) => { ctx.switchToHttp().getRequest().user = mockUser; return true; } })
      .overrideGuard(RolesGuard).useValue({ canActivate: () => true })
      .overrideGuard(TenantIsolationGuard).useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true
      })
    );

    await app.init();
    await app.listen(0);
    const address = app.getHttpServer().address();
    serverUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /pos/orders/123/void succeeds with valid reason', async () => {
    const res = await fetch(`${serverUrl}/pos/orders/123/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Customer changed mind' })
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.status).toBe('CANCELLED');
    expect(json.reason).toBe('Customer changed mind');
    expect(json.actor.source).toBe('POS_MANAGER');
  });

  it('POST /pos/orders/123/refund succeeds with valid reason', async () => {
    const res = await fetch(`${serverUrl}/pos/orders/123/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Billing discrepancy' })
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.status).toBe('REFUNDED');
    expect(json.reason).toBe('Billing discrepancy');
    expect(json.actor.source).toBe('POS_MANAGER');
  });

  it('POST /kds/orders/123/cancel succeeds with valid reason from kitchen', async () => {
    const res = await fetch(`${serverUrl}/kds/orders/123/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Kitchen out of stock' })
    });

    const json = await res.json();
    expect(res.status).toBe(201);
    expect(json.status).toBe('CANCELLED');
    expect(json.reason).toBe('Kitchen out of stock');
    expect(json.actor.source).toBe('KDS_KITCHEN');
  });

  it('POST /pos/orders/123/void rejects empty reason with 400', async () => {
    const res = await fetch(`${serverUrl}/pos/orders/123/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: '   ' })
    });

    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.message).toBe('Validation failed on request payload');
    expect(json.errors[0].field).toBe('reason');
  });
});
