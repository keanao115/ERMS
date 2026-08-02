import 'dotenv/config';
import { PrismaClient, UserRole, OrderStatus, OrderType, TableStatus, PaymentMethod, PaymentStatus, IngredientUnit, ShiftType, AuditAction, KitchenStation } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Enterprise Restaurant Management System (ERMS)...');

  // 1. Create Restaurant Enterprise
  const restaurant = await prisma.restaurant.create({
    data: {
      name: 'Aura Enterprise Hospitality Group',
      logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80',
      taxRegistrationNumber: 'US-TAX-998877665'
    }
  });

  // 2. Create Branches
  const downtownBranch = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Aura Downtown Fine Dining',
      code: 'AURA-DT-01',
      address: '777 Grand Avenue, Suite 100',
      city: 'New York',
      phone: '+1 (212) 555-0199',
      capacity: 120,
      isActive: true
    }
  });

  const waterfrontBranch = await prisma.branch.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Aura Waterfront Bistro',
      code: 'AURA-WF-02',
      address: '400 Marina Boulevard',
      city: 'San Francisco',
      phone: '+1 (415) 555-0244',
      capacity: 90,
      isActive: true
    }
  });

  // 3. Create Enterprise Users across roles
  const passwordHash = await bcrypt.hash('Password123!', 10);

  const users = [
    { email: 'admin@aura.com', role: UserRole.SUPER_ADMIN, firstName: 'Alexander', lastName: 'Vance' },
    { email: 'owner@aura.com', role: UserRole.RESTAURANT_OWNER, firstName: 'Eleanor', lastName: 'Sterling' },
    { email: 'regional@aura.com', role: UserRole.REGIONAL_MANAGER, firstName: 'Marcus', lastName: 'Brody' },
    { email: 'manager@aura.com', role: UserRole.STORE_MANAGER, firstName: 'Sophia', lastName: 'Chen', branchId: downtownBranch.id },
    { email: 'cashier@aura.com', role: UserRole.CASHIER, firstName: 'David', lastName: 'Miller', branchId: downtownBranch.id },
    { email: 'chef@aura.com', role: UserRole.KITCHEN_STAFF, firstName: 'Gordon', lastName: 'Ramsay', branchId: downtownBranch.id },
    { email: 'waiter@aura.com', role: UserRole.WAITER, firstName: 'Lucas', lastName: 'Dupont', branchId: downtownBranch.id },
    { email: 'inventory@aura.com', role: UserRole.INVENTORY_MANAGER, firstName: 'Rachel', lastName: 'Green', branchId: downtownBranch.id },
    { email: 'hr@aura.com', role: UserRole.HR, firstName: 'Claire', lastName: 'Underwood' },
    { email: 'accountant@aura.com', role: UserRole.ACCOUNTANT, firstName: 'Benjamin', lastName: 'Franklin' }
  ];

  const createdUsers: Record<string, any> = {};

  for (const u of users) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        restaurantId: restaurant.id,
        branchId: u.branchId || downtownBranch.id,
        isActive: true
      }
    });
    createdUsers[u.role] = user;
  }

  // 4. Create Tables floor plan for Downtown Branch
  const tableData = [
    { tableNumber: 'T-01', capacity: 2, posX: 10, posY: 10, status: TableStatus.OCCUPIED },
    { tableNumber: 'T-02', capacity: 4, posX: 30, posY: 10, status: TableStatus.BILL_REQUESTED },
    { tableNumber: 'T-03', capacity: 4, posX: 50, posY: 10, status: TableStatus.AVAILABLE },
    { tableNumber: 'T-04', capacity: 6, posX: 70, posY: 10, status: TableStatus.RESERVED },
    { tableNumber: 'T-05', capacity: 2, posX: 10, posY: 40, status: TableStatus.OCCUPIED },
    { tableNumber: 'T-06', capacity: 4, posX: 30, posY: 40, status: TableStatus.AVAILABLE },
    { tableNumber: 'T-07', capacity: 4, posX: 50, posY: 40, status: TableStatus.BUSSING },
    { tableNumber: 'T-08', capacity: 8, posX: 70, posY: 40, status: TableStatus.AVAILABLE }
  ];

  const createdTables: any[] = [];
  for (const t of tableData) {
    const tbl = await prisma.table.create({
      data: {
        branchId: downtownBranch.id,
        ...t
      }
    });
    createdTables.push(tbl);
  }

  // 5. Create Menu Categories & Dishes
  const catApp = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Appetizers & Crudo', sortOrder: 1 }
  });
  const catMain = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Chef Signature Mains', sortOrder: 2 }
  });
  const catSteak = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Prime Steaks & Grills', sortOrder: 3 }
  });
  const catBeverage = await prisma.category.create({
    data: { restaurantId: restaurant.id, name: 'Artisan Cocktails & Wine', sortOrder: 4 }
  });

  // Dishes
  const dishTruffleRisotto = await prisma.menuItem.create({
    data: {
      categoryId: catMain.id,
      name: 'Black Truffle Wild Mushroom Risotto',
      description: 'Acquerello carnaroli rice, black winter truffle butter, 24-month aged Parmigiano Reggiano.',
      basePrice: 38.00,
      station: KitchenStation.GRILL,
      imageUrl: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=600&q=80'
    }
  });

  const dishWagyu = await prisma.menuItem.create({
    data: {
      categoryId: catSteak.id,
      name: 'A5 Miyazaki Wagyu Ribeye',
      description: 'Japanese A5 wagyu, smoked Maldon sea salt, bone marrow reduction glaze.',
      basePrice: 125.00,
      station: KitchenStation.GRILL,
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'
    }
  });

  const dishSalmon = await prisma.menuItem.create({
    data: {
      categoryId: catMain.id,
      name: 'Pan-Seared Ora King Salmon',
      description: 'Crispy skin salmon, sunchoke puree, sea asparagus, citrus velouté.',
      basePrice: 42.00,
      station: KitchenStation.GRILL,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80'
    }
  });

  const dishTunaTartare = await prisma.menuItem.create({
    data: {
      categoryId: catApp.id,
      name: 'Yellowfin Tuna Tartare',
      description: 'Hass avocado, yuzu ponzu emulsion, lotus root crisps, caviar garnish.',
      basePrice: 26.00,
      station: KitchenStation.COLD_PREP,
      imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=600&q=80'
    }
  });

  const dishSmokedOldFashioned = await prisma.menuItem.create({
    data: {
      categoryId: catBeverage.id,
      name: 'Smoked Bourbon Old Fashioned',
      description: 'Single barrel bourbon, Demerara syrup, Angostura bitters, cherrywood smoke infusion.',
      basePrice: 22.00,
      station: KitchenStation.BAR,
      imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80'
    }
  });

  // Variants & Addons
  const wagyuVariant8oz = await prisma.menuItemVariant.create({
    data: { menuItemId: dishWagyu.id, name: '8 oz Standard Cut', priceDelta: 0, sku: 'WAGYU-8OZ' }
  });
  const wagyuVariant12oz = await prisma.menuItemVariant.create({
    data: { menuItemId: dishWagyu.id, name: '12 oz Prime Cut', priceDelta: 45.00, sku: 'WAGYU-12OZ' }
  });

  const addonCaviar = await prisma.menuItemAddon.create({
    data: { menuItemId: dishWagyu.id, name: 'Add Royal Osetra Caviar (10g)', price: 35.00 }
  });

  // 6. Ingredients & Recipe Mappings
  const ingWagyuBeef = await prisma.ingredient.create({
    data: { branchId: downtownBranch.id, name: 'A5 Miyazaki Wagyu Beef', sku: 'ING-WAGYU', unit: IngredientUnit.KG, currentStock: 15.5, minThreshold: 5.0, costPerUnit: 180.00 }
  });

  const ingTruffleButter = await prisma.ingredient.create({
    data: { branchId: downtownBranch.id, name: 'Black Winter Truffle Butter', sku: 'ING-TRUFFLE-BTR', unit: IngredientUnit.KG, currentStock: 3.2, minThreshold: 1.0, costPerUnit: 65.00 }
  });

  const ingSalmon = await prisma.ingredient.create({
    data: { branchId: downtownBranch.id, name: 'Ora King Salmon Fillet', sku: 'ING-SALMON', unit: IngredientUnit.KG, currentStock: 8.0, minThreshold: 3.0, costPerUnit: 34.00 }
  });

  const ingTuna = await prisma.ingredient.create({
    data: { branchId: downtownBranch.id, name: 'Yellowfin Tuna Loin', sku: 'ING-TUNA', unit: IngredientUnit.KG, currentStock: 2.1, minThreshold: 2.5, costPerUnit: 42.00 } // Low Stock!
  });

  // Recipe Mappings
  await prisma.recipeIngredient.create({
    data: { menuItemId: dishWagyu.id, ingredientId: ingWagyuBeef.id, quantityRequired: 0.25 }
  });
  await prisma.recipeIngredient.create({
    data: { menuItemId: dishTruffleRisotto.id, ingredientId: ingTruffleButter.id, quantityRequired: 0.05 }
  });
  await prisma.recipeIngredient.create({
    data: { menuItemId: dishSalmon.id, ingredientId: ingSalmon.id, quantityRequired: 0.22 }
  });

  // 7. Suppliers & Purchase Order
  const supplierMeats = await prisma.supplier.create({
    data: {
      restaurantId: restaurant.id,
      name: 'Grand Pacific Prime Meats Co.',
      contactPerson: 'Robert Sterling',
      email: 'orders@grandpacificmeats.com',
      phone: '+1 (800) 555-MEAT',
      address: '100 Industrial Parkway, Chicago, IL'
    }
  });

  await prisma.purchaseOrder.create({
    data: {
      branchId: downtownBranch.id,
      supplierId: supplierMeats.id,
      poNumber: 'PO-2026-00891',
      status: 'SUBMITTED',
      totalCost: 2700.00,
      expectedDate: new Date(Date.now() + 86400000 * 2),
      items: {
        create: [
          { ingredientId: ingWagyuBeef.id, quantity: 15.0, unitCost: 180.00, totalCost: 2700.00 }
        ]
      }
    }
  });

  // 8. Create Realistic POS Orders
  const order1 = await prisma.order.create({
    data: {
      branchId: downtownBranch.id,
      tableId: createdTables[0].id, // T-01
      createdById: createdUsers[UserRole.WAITER].id,
      orderNumber: 'ORD-1001',
      orderType: OrderType.DINE_IN,
      status: OrderStatus.IN_PREPARATION,
      customerName: 'Jonathan Vance',
      subtotal: 189.00,
      taxAmount: 16.54,
      tipAmount: 35.00,
      totalAmount: 240.54,
      items: {
        create: [
          { menuItemId: dishWagyu.id, variantId: wagyuVariant8oz.id, quantity: 1, unitPrice: 125.00, status: 'COOKING', station: KitchenStation.GRILL, timerStartedAt: new Date() },
          { menuItemId: dishTruffleRisotto.id, quantity: 1, unitPrice: 38.00, status: 'COOKING', station: KitchenStation.GRILL, timerStartedAt: new Date() },
          { menuItemId: dishSmokedOldFashioned.id, quantity: 1, unitPrice: 26.00, status: 'BUMPED', station: KitchenStation.BAR }
        ]
      }
    }
  });

  const order2 = await prisma.order.create({
    data: {
      branchId: downtownBranch.id,
      tableId: createdTables[1].id, // T-02
      createdById: createdUsers[UserRole.CASHIER].id,
      orderNumber: 'ORD-1002',
      orderType: OrderType.DINE_IN,
      status: OrderStatus.PAID,
      customerName: 'Victoria Secret Party',
      subtotal: 211.00,
      taxAmount: 18.46,
      tipAmount: 40.00,
      totalAmount: 269.46,
      items: {
        create: [
          { menuItemId: dishSalmon.id, quantity: 2, unitPrice: 42.00, status: 'SERVED', station: KitchenStation.GRILL },
          { menuItemId: dishTunaTartare.id, quantity: 1, unitPrice: 26.00, status: 'SERVED', station: KitchenStation.COLD_PREP },
          { menuItemId: dishSmokedOldFashioned.id, quantity: 4, unitPrice: 22.00, status: 'SERVED', station: KitchenStation.BAR }
        ]
      },
      payments: {
        create: [
          { paymentMethod: PaymentMethod.CREDIT_CARD, amount: 134.73, tipAmount: 20.00, status: PaymentStatus.COMPLETED, seatNumber: 1, transactionRef: 'TXN-9988112' },
          { paymentMethod: PaymentMethod.APPLE_PAY, amount: 134.73, tipAmount: 20.00, status: PaymentStatus.COMPLETED, seatNumber: 2, transactionRef: 'TXN-9988113' }
        ]
      }
    }
  });

  // 9. Employee Staff Shifts & Attendance
  const empWaiter = await prisma.employee.create({
    data: {
      userId: createdUsers[UserRole.WAITER].id,
      branchId: downtownBranch.id,
      jobTitle: 'Senior Fine Dining Waiter',
      hourlyRate: 24.50
    }
  });

  await prisma.shift.create({
    data: {
      employeeId: empWaiter.id,
      branchId: downtownBranch.id,
      shiftType: ShiftType.EVENING,
      startTime: new Date(Date.now() - 3600000 * 4),
      endTime: new Date(Date.now() + 3600000 * 4),
      isApproved: true
    }
  });

  await prisma.attendance.create({
    data: {
      employeeId: empWaiter.id,
      clockIn: new Date(Date.now() - 3600000 * 4)
    }
  });

  // 10. Audit Log Initial Records
  await prisma.auditLog.create({
    data: {
      userId: createdUsers[UserRole.SUPER_ADMIN].id,
      userRole: UserRole.SUPER_ADMIN,
      action: AuditAction.CREATE,
      entityName: 'Restaurant',
      entityId: restaurant.id,
      payload: JSON.stringify({ name: restaurant.name }),
      ipAddress: '127.0.0.1',
      traceId: 'TRC-BOOTSTRAP-0001'
    }
  });

  console.log('✅ Enterprise Seed complete!');
  console.log('🔑 Default Login Credentials:');
  console.log('   Admin: admin@aura.com / Password123!');
  console.log('   Manager: manager@aura.com / Password123!');
  console.log('   Cashier: cashier@aura.com / Password123!');
  console.log('   Chef: chef@aura.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
