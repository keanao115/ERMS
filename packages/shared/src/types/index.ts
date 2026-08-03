import { UserRole, OrderStatus, OrderItemStatus, OrderType, TableStatus, PaymentMethod, PaymentStatus, IngredientUnit, PurchaseOrderStatus, ShiftType, AuditAction, KitchenStation } from '../enums';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface UserSession {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  branchId: string | null;
  restaurantId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  branchId: string | null;
  restaurantId: string | null;
  jti: string;
  iat?: number;
  exp?: number;
}

export interface SocketOrderPlacedPayload {
  orderId: string;
  orderNumber: string;
  tableNumber?: string;
  station: KitchenStation;
  itemsCount: number;
}

export interface SocketItemStatusChangedPayload {
  orderItemId: string;
  orderId: string;
  status: OrderItemStatus;
  station: KitchenStation;
}

export interface ExecutiveDashboardMetrics {
  totalRevenue: number;
  totalCOGS: number;
  grossProfit: number;
  netMarginPercentage: number;
  totalOrders: number;
  totalTax: number;
  totalTips: number;
  occupancyRate: number;
  activeTables: number;
  totalTables: number;
}
