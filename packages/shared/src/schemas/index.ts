import { z } from 'zod';
import { OrderType, PaymentMethod, UserRole, TableStatus, IngredientUnit, PurchaseOrderStatus, ShiftType } from '../enums';

// Auth Schemas
export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token required')
});

// POS & Order Schemas
export const CreateOrderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  quantity: z.number().int().positive(),
  notes: z.string().optional(),
  addonIds: z.array(z.string().uuid()).optional()
});

export const CreateOrderSchema = z.object({
  branchId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  orderType: z.nativeEnum(OrderType),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  items: z.array(CreateOrderItemSchema).min(1, 'Order must contain at least one item')
});

export const SplitPaymentItemSchema = z.object({
  amount: z.number().positive(),
  paymentMethod: z.nativeEnum(PaymentMethod),
  tipAmount: z.number().nonnegative().default(0),
  seatNumber: z.number().int().positive().optional(),
  giftCardCode: z.string().optional(),
  couponCode: z.string().optional()
});

export const SettleOrderPaymentSchema = z.object({
  orderId: z.string().uuid(),
  payments: z.array(SplitPaymentItemSchema).min(1, 'At least one payment entry required')
});

// Reservation Schema
export const CreateReservationSchema = z.object({
  branchId: z.string().uuid(),
  tableId: z.string().uuid().optional(),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(7),
  partySize: z.number().int().positive(),
  reservationTime: z.string().datetime(),
  specialNotes: z.string().optional()
});

// Inventory Schemas
export const CreateIngredientSchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(2),
  sku: z.string().min(2),
  unit: z.nativeEnum(IngredientUnit),
  currentStock: z.number().nonnegative(),
  minThreshold: z.number().positive(),
  costPerUnit: z.number().positive()
});

export const CreatePurchaseOrderSchema = z.object({
  branchId: z.string().uuid(),
  supplierId: z.string().uuid(),
  expectedDate: z.string().datetime().optional(),
  items: z.array(z.object({
    ingredientId: z.string().uuid(),
    quantity: z.number().positive(),
    unitCost: z.number().positive()
  })).min(1)
});

// Employee Schema
export const CreateEmployeeSchema = z.object({
  branchId: z.string().uuid(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string(),
  role: z.nativeEnum(UserRole),
  hourlyRate: z.number().positive()
});

export const CreateShiftSchema = z.object({
  employeeId: z.string().uuid(),
  branchId: z.string().uuid(),
  shiftType: z.nativeEnum(ShiftType),
  startTime: z.string().datetime(),
  endTime: z.string().datetime()
});
