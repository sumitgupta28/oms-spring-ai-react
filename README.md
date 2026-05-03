# OMS — Order Management System

A microservices-based Order Management System built with Spring Boot 3.4.1, Kafka saga choreography, Keycloak, and React 18.

## Tech Stack

| Layer | Technology |
|---|---|
| API Gateway | Spring Cloud Gateway (WebFlux) |
| Microservices | Spring Boot 3.4.1, Java 21 |
| Messaging | Apache Kafka (saga choreography) |
| Auth | Keycloak 24 (OIDC/OAuth2, PKCE) |
| Database | PostgreSQL (per-service schema) |
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, Zustand |
| Containerisation | Docker Compose |

---

## Prerequisites

- **Java 21** (`java -version` must show 21)
- **Docker Desktop** (PostgreSQL, Kafka, Keycloak run in containers)
- **Node 18+** and npm (for the React UI only)
- **jq** — used in the e2e curl scripts (`brew install jq` on Mac)
- Gradle wrapper is included — no local Gradle install needed

---

## Quick Start

```bash
# 1. Start infrastructure (DB, Kafka, Keycloak)
docker compose up postgres zookeeper kafka kafka-ui keycloak -d

# 2. Start all backend services
docker compose up -d

# 3. Start React UI (dev server at http://localhost:3000)
cd react-ui && npm install && npm run dev
```

**Service ports:** API Gateway `8080` · Order `8081` · Payment `8082` · Product `8084` · Keycloak `8180` · Kafka-UI `8090` · React `3000`

**Seed accounts (Keycloak):**

| Username | Password | Role |
|---|---|---|
| `admin` | `admin123` | ROLE_ADMIN |
| `customer1` | `customer123` | ROLE_CUSTOMER |
| `vendor1` | `vendor123` | ROLE_VENDOR |
| `support1` | `support123` | ROLE_SUPPORT |

---

## Architecture

The system uses **Kafka saga choreography** — no central orchestrator. Each service reacts to events and publishes results.

```
order-service      → order.created
product-service    → inventory.reserved  OR  inventory.reservation.failed
payment-service    → payment.succeeded   OR  payment.failed
order-service      → order.confirmed     OR  order.cancelled
product-service    consumes order.cancelled → releases reserved inventory (compensating tx)
```

Key patterns:
- **Transactional Outbox** (order-service) — business logic writes an `OutboxEvent` row in the same DB transaction; a poller publishes it to Kafka. Prevents dual-write inconsistency.
- **Optimistic Locking** (inventory) — `@Version` field on `Inventory`; concurrent reservation conflicts publish a failure event to trigger saga rollback.
- **Defense-in-depth security** — every service is an independent OAuth2 Resource Server, not just the gateway.

Module layout:
```
shared-events/    ← Kafka event DTOs shared across all services
api-gateway/      ← Gateway, CORS, JWT validation, TokenRelay (port 8080)
order-service/    ← Saga entry point, outbox pattern (port 8081)
payment-service/  ← Mock payment, 90% success rate (port 8082)
product-service/  ← Products + inventory management (port 8084)
react-ui/         ← Vite + React 18 SPA (port 3000)
infra/            ← Keycloak realm config, Postgres init scripts
```

For full build commands, Kafka consumer group table, and adding-a-new-service checklist, see [CLAUDE.md](CLAUDE.md).

---

## Claude Code — AI Developer Tools

This project ships three layers of AI-assisted developer tooling under `.claude/`:

```
.claude/
├── skills/
│   ├── test-patterns/       ← OMS testing conventions
│   └── review-standards/    ← Code review checklist
├── agents/
│   ├── test-generator/      ← Writes JUnit 5 tests
│   └── code-reviewer/       ← Reviews code, reports findings
├── hooks/
│   └── run-checks.sh        ← Runs tests/lint after every file edit
└── settings.local.json      ← Hook wiring + permissions
```

**How the layers connect:**

```
Skills (what good looks like)
  └─ preloaded into → Subagents (how to do the work)
                            └─ triggered by → Hooks (when to run automatically)
```

Updating a skill file immediately updates what both humans and subagents enforce — one source of truth.

---

### Skills

Skills are reusable knowledge bases. Invoke them manually with `/skill-name` in the Claude Code prompt, or they are automatically preloaded into subagents.

#### `/test-patterns`

File: `.claude/skills/test-patterns/SKILL.md`

OMS-specific testing conventions:
- Spring Boot test slice selection (`@SpringBootTest` vs `@WebMvcTest` vs `@DataJpaTest`)
- `@EmbeddedKafka` pattern for Kafka consumer tests
- Outbox pattern testing: assert `OutboxEvent` saved in same transaction; assert poller publishes and marks published
- Optimistic locking concurrency test
- Naming: `methodName_whenCondition_shouldExpectedBehavior`
- Mockito service-layer patterns, Awaitility for async assertions

```
# Invoke manually
/test-patterns

# Or ask Claude to apply the patterns
"what test slice should I use for a Kafka consumer?"
```

#### `/review-standards`

File: `.claude/skills/review-standards/SKILL.md`

OMS-specific review checklist with three severity levels:

| Severity | Examples |
|---|---|
| **Critical** | Direct Kafka publish from business logic, missing OAuth2 resource server config |
| **Major** | Missing compensating transaction, wrong consumer group ID, inventory save without lock handling |
| **Minor** | Naming, null checks, wrong HTTP status codes |

```
# Invoke manually
/review-standards
```

---

### Subagents

Subagents run in an isolated context window. Claude automatically delegates to them when your prompt matches their description. They preload the shared skills above.

#### `test-generator`

File: `.claude/agents/test-generator/AGENT.md` · Preloads: `test-patterns`

**Trigger phrases:**
- "generate tests for `OrderService.java`"
- "add test coverage for the payment consumer"
- "write unit tests for `InventoryService`"

**Workflow:** reads the source file → picks the correct test slice → writes test class to `src/test/java/` → runs `./gradlew :<module>:test` → reports covered and uncovered scenarios.

**Example:**
```
User:  generate tests for order-service/.../OrderService.java

Agent: Writes  order-service/src/test/java/.../OrderServiceTest.java
       Runs    ./gradlew :order-service:test
       Reports "6 test cases generated. Uncovered: concurrent order creation."
```

#### `code-reviewer`

File: `.claude/agents/code-reviewer/AGENT.md` · Preloads: `review-standards`

**Trigger phrases:**
- "review changes on this branch"
- "review `PaymentService.java`"
- "check this PR before I merge"
- "audit the security config in product-service"

**Workflow:** reads specified file(s) or runs `git diff main...HEAD` → checks every item in `review-standards` → reports Critical → Major → Minor with `file:line` references. Never edits files.

**Output format:**
```
## Critical
- [PaymentService.java:34] kafkaTemplate.send() called directly from business logic
  → Bypasses the outbox — event lost if DB rolls back
  → Write OutboxEvent in same @Transactional method instead

## Major
- [PaymentService.java:61] ObjectOptimisticLockingFailureException not handled
  → Concurrent requests throw unhandled exception
  → Wrap saveAndFlush() in try/catch; publish PaymentFailedEvent on catch

## Minor
None.

## Summary
1 critical, 1 major, 0 minor issues found.
```

---

### Automated Hooks

Hooks fire after every file edit — no prompt needed.

#### Hook 1 — Module test runner (async shell)

Detects the edited module from the file path and runs the appropriate check:

| Edited path | Command |
|---|---|
| `order-service/**` | `./gradlew :order-service:test` |
| `product-service/**` | `./gradlew :product-service:test` |
| `payment-service/**` | `./gradlew :payment-service:test` |
| `api-gateway/**` | `./gradlew :api-gateway:test` |
| `react-ui/**` | `npm run lint` |

#### Hook 2 — Automated code review (agent hook)

Spawns the `code-reviewer` subagent for any edited Java source file. Reports Critical and Major issues only — Minor is suppressed in automated mode to reduce noise.

---

### Updating Standards

Edit the skill files directly — changes take effect immediately, no restart needed:

```bash
# Update testing conventions
.claude/skills/test-patterns/SKILL.md

# Update review checklist
.claude/skills/review-standards/SKILL.md
```
