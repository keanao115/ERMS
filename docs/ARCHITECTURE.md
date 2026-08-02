# ERMS Technical Architecture Overview

## Monorepo Layout
```
ERMS/
├── apps/
│   ├── backend/               # NestJS Enterprise Application
│   └── frontend/              # Next.js 15 Apple-Inspired UI App Router
├── packages/
│   └── shared/                # Shared Types, Zod DTOs, Enums
├── docker/                    # Docker & Prometheus Infrastructure
└── docs/                      # Enterprise Documentation Suite
```

## Key Architectural Highlights

1. **Domain-Driven Bounded Contexts**:
   - **POS Context**: Table layout, bill splitting, tax/tips, payment settlement.
   - **Kitchen Context (KDS)**: Real-time WebSockets station dispatch, preparation timers, bump actions.
   - **Inventory Context**: Recipe mapping, automated stock deduction on payment, reorder alerts.
   - **HR & Workforce Context**: Shift roster scheduling, timecard attendance, payroll wage calculations.
   - **Reporting Context**: Revenue aggregations, COGS calculation, dish velocity.

2. **Event-Driven Domain Decoupling**:
   - Asynchronous domain event bus emitting `OrderPlaced`, `PaymentCompleted`, `InventoryAdjusted`, `KdsStatusChanged`, and `LowStockAlertTriggered`.
   - Payment completion automatically triggers recipe-based ingredient stock deduction without tight coupling.

3. **Apple Design Philosophy (Frontend UI)**:
   - Built with Next.js 15, Tailwind CSS, and Framer Motion.
   - Heavy emphasis on minimalist glassmorphism (`backdrop-blur-md`), SF Pro typography, HSL color tokens, dark/light mode elegance, and zero cluttered dashboards.
