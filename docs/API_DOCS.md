# OpenAPI & WebSockets API Reference

## REST API Endpoints Summary

### Authentication (`/api/v1/auth`)
- `POST /auth/login`: Authenticate credentials, returns Access Token & Refresh Token.
- `POST /auth/logout`: Revoke active JWT token in Redis blacklist.

### Point of Sale (`/api/v1/pos`)
- `POST /pos/orders`: Draft & place new order (Dine-in, Takeout, Delivery).
- `GET /pos/orders`: Retrieve active branch orders with item & payment detail.
- `POST /pos/settle`: Settle order payment with split-bill support.

### Kitchen Display System (`/api/v1/kds`)
- `GET /kds/queue`: Fetch live cooking queue for specified station.

### Inventory (`/api/v1/inventory`)
- `GET /inventory/ingredients`: Fetch stock ledger with current levels & thresholds.
- `GET /inventory/purchase-orders`: Fetch active supplier purchase orders.

### Analytics (`/api/v1/analytics`)
- `GET /analytics/dashboard`: Aggregate daily gross revenue, occupancy, top dishes.

### Audit Log (`/api/v1/audit-logs`)
- `GET /audit-logs`: Fetch security audit logs with action filters.

---

## WebSockets Socket.io Events (`/kds`)
- **Event Outbound**: `kds:order_placed` — Broadcasts newly placed POS order to kitchen.
- **Event Inbound**: `kds:bump_item` — Station staff bumps item state (`QUEUED` → `COOKING` → `BUMPED`).
- **Event Outbound**: `kds:item_updated` — Notifies expediter pass and waiters.
