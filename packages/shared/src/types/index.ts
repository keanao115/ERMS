import { UserRole, OrderStatus, OrderItemStatus, OrderType, TableStatus, PaymentMethod, PaymentStatus, IngredientUnit, PurchaseOrderStatus, ShiftType, AuditAction, KitchenStation } from '../enums';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    traceId?: string;
  };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId?: string;
  restaurantId?: string;
  iat?: number;
  exp?: number;
  jti?: string;
}

export interface DomainEvent<T = any> {
  eventId: string;
  eventName: string;
  timestamp: string;
  aggregateId: string;
  tenantId?: string;
  traceId?: string;
  payload: T;
}

export interface KdsOrderEvent {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  orderType: OrderType;
  station: KitchenStation;
  items: Array<{
    orderItemId: string;
    menuItemName: string;
    variantName?: string;
    quantity: number;
    notes?: string;
    addons?: string[];
    status: OrderItemStatus;
    timerStartedAt?: string;
  }>;
  createdAt: string;
}
