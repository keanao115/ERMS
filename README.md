# Enterprise Restaurant Management System (ERMS) 🍽️

> **Commercial-Grade Multi-Tenant SaaS Platform for Modern Hospitality Operations**

ERMS is a production-quality Enterprise Restaurant Management System designed according to enterprise software engineering standards, domain-driven design (DDD), modular clean architecture, Apple-inspired UI aesthetics, real-time WebSockets event dispatching, and automated inventory stock deduction.

---

## 🌟 Executive Key Features

- 💎 **Apple-Inspired Aesthetic UI**: Minimalist glassmorphic dark design built with Next.js 15, React, Tailwind CSS, and Framer Motion micro-animations.
- ⚡ **Point of Sale (POS) Terminal**: Table visual picker, dish category pills, instant search, quantity modifiers, bill splitting (equal or by seat/item), tip presets, and print-ready receipt formatting.
- 🍳 **Kitchen Display System (KDS)**: Real-time Socket.io station dispatch matrix (Grill, Cold Prep, Bar), live prep timers with overdue status colors, and instant item bump actions.
- 📦 **Automated Inventory & Recipes**: Mapped dish recipes automatically deduct ingredient stock upon POS payment completion, triggering low-stock threshold alerts and draft Purchase Orders.
- 📊 **Executive Analytics & COGS**: Real-time sales ticker, daily gross revenue aggregations, Cost of Goods Sold (COGS) ratio, net profit margin analysis, and peak operational hours heatmaps.
- 👥 **Workforce & Shift Scheduler**: Staff directory, timecard clock-in attendance, shift roster scheduling, and wage payroll calculations.
- 🛡️ **Enterprise Security & Audit**: Dual-token JWT with Redis revocation blacklist, fine-grained RBAC & ABAC policy enforcement, Helmet CSP protection, and immutable audit logging.

---

## 🏗️ Architecture & Monorepo Structure

```
ERMS/
├── apps/
│   ├── backend/               # NestJS Enterprise Application (REST API, WebSockets, Prisma)
│   └── frontend/              # Next.js 15 App Router (Apple Design System, Framer Motion)
├── packages/
│   └── shared/                # Shared Types, Zod Schemas & Enums (@erms/shared)
├── docker/                    # Docker Compose, PostgreSQL, Redis, Prometheus
└── docs/                      # Comprehensive Enterprise Documentation Suite
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v20+
- npm v10+
- Docker & Docker Compose

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Spin Up Infrastructure Containers
```bash
cd docker
docker-compose up -d postgres redis
```

### Step 3: Run Database Migrations & Seed Data
```bash
npm run db:push
npm run db:seed
```

### Step 4: Start Applications
- **Backend Service (NestJS - Port 4000)**:
  ```bash
  npm run dev:backend
  ```
- **Frontend App (Next.js 15 - Port 3000)**:
  ```bash
  npm run dev:frontend
  ```

---

## 🔑 Demo Account Personas

| Role | Email | Password | Access Capabilities |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@aura.com` | `Password123!` | Global Organization & Infrastructure Override |
| **Store Manager** | `manager@aura.com` | `Password123!` | Branch Operations, Shift Scheduling, Audit Logs |
| **Cashier** | `cashier@aura.com` | `Password123!` | POS Terminal, Bill Splitting, Receipts |
| **Head Chef** | `chef@aura.com` | `Password123!` | KDS Station Queue, Prep Timers, Bump Actions |

---

## 📚 Documentation Sitemap

- 🏛️ [Architecture Specifications](docs/ARCHITECTURE.md)
- 🗄️ [Database ERD & Schema Matrix](docs/DATABASE_SCHEMA.md)
- 📡 [OpenAPI REST & WebSockets Reference](docs/API_DOCS.md)
- 🔐 [Enterprise Security Specification](docs/SECURITY.md)
