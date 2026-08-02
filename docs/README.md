# Enterprise Restaurant Management System (ERMS) Documentation Suite

Welcome to the documentation suite for the **Enterprise Restaurant Management System (ERMS)**. This platform is an enterprise-grade multi-tenant SaaS application built for high-performance hospitality management across multi-branch fine dining, fast-casual, and cloud-kitchen operations.

## Executive Sitemap

1. 🏛️ **[Technical Architecture Guide](ARCHITECTURE.md)**: Deep dive into the monorepo structure, Event-Driven Architecture (EDA), WebSockets station dispatch, state machines, and micro-services strategy.
2. 🗄️ **[Database Schema & ER Diagram](DATABASE_SCHEMA.md)**: Normalized PostgreSQL entity relationship diagram (25+ entities), indexing rationale, and Prisma ORM models.
3. 📡 **[REST & WebSockets API Specifications](API_DOCS.md)**: OpenAPI reference, request/response DTO schemas, and real-time Socket.io KDS events.
4. 🔐 **[Enterprise Security Specification](SECURITY.md)**: JWT token revocation via Redis, fine-grained RBAC + ABAC matrix, mTLS readiness, and immutable security audit logging.

---

## Getting Started Quickly

### Prerequisites
- Node.js v20+
- npm v10+
- Docker & Docker Compose

### Local Development Setup

1. **Install Monorepo Workspaces**:
   ```bash
   npm install
   ```

2. **Spin Up Infrastructure Containers (PostgreSQL & Redis)**:
   ```bash
   cd docker
   docker-compose up -d postgres redis
   ```

3. **Run Prisma Migrations & Seed Data**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

4. **Start Development Servers**:
   - Backend NestJS (Port 4000):
     ```bash
     npm run dev:backend
     ```
   - Frontend Next.js 15 (Port 3000):
     ```bash
     npm run dev:frontend
     ```

5. **Demo Accounts**:
   - **Super Admin**: `admin@aura.com` / `Password123!`
   - **Store Manager**: `manager@aura.com` / `Password123!`
   - **Cashier**: `cashier@aura.com` / `Password123!`
   - **Head Chef**: `chef@aura.com` / `Password123!`
