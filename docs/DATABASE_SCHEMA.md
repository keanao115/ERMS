# Database Schema Specification & ER Diagram

## Schema Entity Matrix (25+ Relational Entities)

```
[Restaurant] ──1:N──► [Branch] ──1:N──► [Table] ──1:N──► [Order] ──1:N──► [OrderItem]
     │                   │                │                 │                  │
     │                   │                └─1:N─[Reservation] └─1:N─[Payment] └─1:N─[OrderItemAddon]
     │                   │
     ├─1:N─► [Category] ─┼─1:N─► [Employee] ──1:N──► [Shift]
     │         │         │                    ├─1:N──► [Attendance]
     │         └─1:N──►  │                    └─1:N──► [Payroll]
     │              [MenuItem] ──1:N──► [MenuItemVariant]
     │                   │
     │                   └─1:N─► [RecipeIngredient] ◄─N:1─ [Ingredient] ◄─1:N─ [InventoryTransaction]
     │                                                           ▲
     └─1:N─► [Supplier] ──────1:N──────► [PurchaseOrder] ─1:N────┘
```

## Indexing & Performance Optimization
- `User(email)` and `User(role)` indexed for O(1) JWT authentication verification.
- `Order(branchId, createdAt)` compound index for instant executive daily revenue aggregation.
- `Table(branchId, status)` index for visual floor plan layout updates.
- `Ingredient(branchId, sku)` unique composite key preventing inventory duplication.
