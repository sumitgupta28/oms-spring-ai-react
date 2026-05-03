# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Prerequisites

- **Java 21** — `java -version` must show 21; services will not compile on earlier versions
- **Docker Desktop** — runs PostgreSQL, Kafka, Zookeeper, Keycloak, Kafka-UI
- **Node 18+** and npm — for `react-ui` only; not managed by Gradle
- **jq** — required for the e2e curl scripts below (`brew install jq` on Mac)
- **Gradle wrapper included** — no local Gradle install needed; use `./gradlew`

## Build & Run Commands

### Gradle (Java services)
```bash
./gradlew build -x test          # build all modules, skip tests
./gradlew build                  # build + run all tests
./gradlew :order-service:build   # build a single module
./gradlew :order-service:test    # run tests for one module
./gradlew :order-service:bootRun # run a service locally (needs infra running)
```

### React UI
```bash
cd react-ui
npm install
npm run dev      # dev server at http://localhost:3000
npm run build    # production build (tsc + vite)
npm run lint     # eslint
```

### Infrastructure (Docker Compose)
```bash
# Start infra only (DB, Kafka, Keycloak)
docker compose up postgres zookeeper kafka kafka-ui keycloak -d

# Start all services
docker compose up -d

# Rebuild and restart a single service after code changes
docker compose up --build product-service -d
```

### End-to-end saga test (requires infra + services running)
```bash
TOKEN=$(curl -s -X POST http://localhost:8180/realms/oms-realm/protocol/openid-connect/token \
  -d "grant_type=password&client_id=oms-client&username=customer1&password=customer123" \
  | jq -r .access_token)

# Create product (as admin)
ADMIN=$(curl -s -X POST http://localhost:8180/realms/oms-realm/protocol/openid-connect/token \
  -d "grant_type=password&client_id=oms-client&username=admin&password=admin123" \
  | jq -r .access_token)
curl -X POST http://localhost:8080/api/products \
  -H "Authorization: Bearer $ADMIN" -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":9.99,"sku":"SKU-001","category":"Electronics","initialQuantity":100}'

# Place order (as customer1) — replace <product-id>
curl -X POST http://localhost:8080/api/orders \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"items":[{"productId":"<product-id>","productName":"Widget","quantity":2,"unitPrice":9.99}],"shippingAddress":"123 Main St"}'
```

## Architecture

### Module Structure
Gradle multimodule monorepo. `react-ui` is excluded from Gradle (npm only).

```
shared-events/          ← Pure Java library: Kafka event DTOs + enums. Compiled as JAR, depended on by all services.
api-gateway/            ← Spring Cloud Gateway (WebFlux). Port 8080. Handles CORS, JWT validation, TokenRelay to downstream services.
product-service/        ← Port 8084. PostgreSQL DB: oms_products. Manages products + inventory.
order-service/          ← Port 8081. PostgreSQL DB: oms_orders. Saga entry point.
payment-service/        ← Port 8082. PostgreSQL DB: oms_payments. Mock payment (90% success).
react-ui/               ← Vite + React 18 + TypeScript + Tailwind. Port 3000.
infra/                  ← keycloak/oms-realm.json (imported on startup), postgres/init-multiple-databases.sh
```

### Saga Choreography (Kafka)
Order creation triggers a chain of events. No orchestrator — each service reacts and publishes.

```
order-service      → order.created
product-service    → inventory.reserved  OR  inventory.reservation.failed
payment-service    → payment.succeeded   OR  payment.failed
order-service      → order.confirmed     OR  order.cancelled
product-service    consumes order.cancelled → releases reserved inventory (compensating tx)
```

`OrderConfirmedEvent` and `OrderCancelledEvent` are published but have no consumers yet (notification service was intentionally deferred).

### Transactional Outbox (order-service)
`order-service` never publishes to Kafka directly from business logic. Instead:
1. `OrderService` writes an `OutboxEvent` row **in the same DB transaction** as the order.
2. `OutboxPoller` (`@Scheduled(fixedDelay=2000)`) polls `outbox_events WHERE published=FALSE`, publishes to Kafka, marks `published=true`.
3. Topic mapping is in `OutboxPoller.EVENT_TOPIC_MAP`.

### Inventory — Optimistic Locking
`Inventory.java` has `@Version long version`. `InventoryService.reserveInventory()` catches `ObjectOptimisticLockingFailureException` and publishes `InventoryReservationFailedEvent` to trigger saga rollback.

### Kafka Consumer Groups
| Service | Group ID | Consumes |
|---|---|---|
| product-service | `product-service-order-consumer` | order.created, order.cancelled |
| order-service | `order-service-payment-consumer` | payment.succeeded, payment.failed |
| payment-service | `payment-service-inventory-consumer` | inventory.reserved, inventory.reservation.failed |

Each service has its own `KafkaConfig.java` with hard-coded group ID. If you change a group ID, update both the config class and this table.

### Security
- Each service is an independent OAuth2 Resource Server (not just the gateway). Defense-in-depth.
- JWT converter in every `SecurityConfig.java` extracts `realm_access.roles` → `ROLE_` prefixed `GrantedAuthority`.
- Gateway uses `TokenRelay=` filter to forward the Bearer token downstream.
- Public endpoints: `GET /api/products/**`, `GET /api/inventory/**`, `/actuator/**`, `/swagger-ui/**`, `/v3/api-docs/**`.

### Keycloak
- Realm: `oms-realm` · Client: `oms-client` (public, PKCE S256, no secret)
- Realm config auto-imported from `infra/keycloak/oms-realm.json` on `start-dev --import-realm`
- Seed users: `admin/admin123` (ROLE_ADMIN), `customer1/customer123` (ROLE_CUSTOMER), `vendor1/vendor123` (ROLE_VENDOR), `support1/support123` (ROLE_SUPPORT)
- Keycloak runs on port **8180** locally; inside Docker network it is `keycloak:8080`

### React UI
- `src/keycloak.ts` — singleton Keycloak instance; `main.tsx` calls `keycloak.init({onLoad:'login-required'})` before mounting React.
- `src/api/axiosInstance.ts` — Axios interceptor silently refreshes token (`updateToken(30)`) on every request.
- `src/store/cartStore.ts` — Zustand store, persisted to `localStorage` key `oms-cart`.
- `src/hooks/useAuth.ts` — reads `keycloak.tokenParsed.realm_access.roles` for role checks.
- `OrderDetailPage` polls via React Query `refetchInterval: 3000` while order status is `PENDING`.
- `ProtectedRoute` accepts an optional `requiredRole` prop (e.g., `"ROLE_ADMIN"`).

## Service Ports Quick Reference
| Service | Local port |
|---|---|
| API Gateway | 8080 |
| Order Service | 8081 |
| Payment Service | 8082 |
| Product Service | 8084 |
| Keycloak | 8180 |
| Kafka-UI | 8090 |
| React UI | 3000 |
| PostgreSQL | 5432 |
| Kafka (external) | 9094 |

## Adding a New Service
1. Create module directory, add `include '<name>'` to `settings.gradle`.
2. Copy `build.gradle` pattern from an existing service.
3. Add `implementation project(':shared-events')` to consume existing events.
4. Register a new Kafka consumer group ID (follow naming pattern `<service>-<upstream>-consumer`).
5. Add a new database name to `POSTGRES_MULTIPLE_DATABASES` in `docker-compose.yml` and `infra/postgres/init-multiple-databases.sh`.
6. Add route to `api-gateway/src/main/resources/application.yml`.
7. Add service block to `docker-compose.yml`.

## Testing Strategy

Test directories are scaffolded but empty — no tests exist yet. When writing tests:

- **Java services:** JUnit 5 + Spring Boot Test (via `spring-boot-starter-test`, already in all `build.gradle` files)
- **Kafka consumers:** `@EmbeddedKafka` from `spring-kafka-test` (already in `order-service` and `product-service` build.gradle); use `Awaitility` for async assertions, never `Thread.sleep`
- **Service layer:** Mockito unit tests with `@ExtendWith(MockitoExtension.class)` — mock repositories, test business logic in isolation
- **Controllers:** `@WebMvcTest` — HTTP layer only, mock service dependencies
- **Repositories:** `@DataJpaTest` — DB queries, constraints, custom query methods
- **React:** No test framework configured yet — add Vitest + React Testing Library before writing frontend tests
- See `.claude/skills/test-patterns/SKILL.md` for detailed patterns, naming conventions, and code examples specific to this project

## Claude Code Developer Tools

Custom agents, skills, and hooks are configured under `.claude/`. They activate automatically during development.

### Mermaid JS syntax
- Always output diagrams using Mermaid JS syntax. Use Mermaid for flowcharts, sequence diagrams, and class diagrams

### Skills (invoke manually or auto-loaded by subagents)
- `/test-patterns` — OMS-specific testing conventions (Spring Boot slices, Kafka, outbox, optimistic locking)
- `/review-standards` — code review checklist with Critical / Major / Minor severity levels covering saga, outbox, security, and API patterns

### Subagents (Claude auto-delegates based on your request)
- `test-generator` — reads a source file, chooses the correct test slice, writes JUnit 5 tests to `src/test/java/`, runs them via Gradle
- `code-reviewer` — reviews a file or branch diff against OMS architectural patterns; reports only, never edits

### Hooks (fire automatically after every file edit)
- **PostToolUse command hook (async):** runs `./gradlew :<module>:test` or `npm run lint` for the module matching the edited file path
- **PostToolUse agent hook:** spawns the `code-reviewer` subagent on any edited Java source file; reports Critical and Major issues only (Minor suppressed to reduce noise)

See `README.md` for full usage examples and trigger phrases.
