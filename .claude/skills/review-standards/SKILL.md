---
name: review-standards
description: OMS-specific code review checklist covering saga choreography, outbox pattern, security config, inventory locking, Kafka consumer groups, and API conventions
---

# OMS Code Review Standards

## Severity Classification

- **Critical** — security vulnerabilities, data loss, broken transactions
- **Major** — saga/outbox violations, missing compensating transactions, incorrect event flow
- **Minor** — naming, style, missing null checks, log messages

Always report Critical and Major. Report Minor only in full reviews (not automated hooks).

---

## 1. Saga Choreography Correctness (Major/Critical)

Every service that consumes an event **must** publish a result event on both success and failure paths.

| Consumed event | Expected success publish | Expected failure publish |
|---|---|---|
| `order.created` | `inventory.reserved` | `inventory.reservation.failed` |
| `inventory.reserved` | `payment.succeeded` | `payment.failed` |
| `inventory.reservation.failed` | _(triggers cancellation)_ | — |
| `payment.succeeded` / `payment.failed` | `order.confirmed` / `order.cancelled` | — |
| `order.cancelled` | _(inventory release — no publish required)_ | — |

**Check:** If a consumer method has no publish on the failure path, flag as **Major**.

**Check:** If a compensating transaction is missing (e.g., inventory not released when order cancelled), flag as **Critical**.

---

## 2. Outbox Pattern Enforcement (Critical)

Business logic must **never** call `KafkaTemplate` or `kafkaTemplate.send()` directly.

- All Kafka publishing must go through `OutboxPoller`
- `OutboxEvent` row must be saved **in the same `@Transactional` method** as the domain entity (order, payment, inventory)
- If `OutboxEvent` is saved in a separate transaction or outside `@Transactional`, flag as **Critical**

```java
// WRONG — direct Kafka call from business logic
kafkaTemplate.send("order.created", event); // ❌ Critical

// RIGHT — write outbox event in same transaction
@Transactional
public Order createOrder(CreateOrderRequest request) {
    var order = orderRepository.save(...);
    outboxEventRepository.save(new OutboxEvent("OrderCreatedEvent", ...)); // ✅
    return order;
}
```

---

## 3. Security Configuration (Critical)

Each service must be an **independent OAuth2 Resource Server** — not just relying on the API Gateway.

Check every `SecurityConfig.java`:
- Must extend or configure `SecurityFilterChain` with `.oauth2ResourceServer(oauth2 -> oauth2.jwt(...))`
- JWT converter must extract `realm_access.roles` → `ROLE_` prefixed authorities
- Public endpoints must be explicitly listed with `.requestMatchers(...).permitAll()`
- Default must be `.anyRequest().authenticated()`

```java
// JWT roles extractor must look like this
jwtAuthenticationConverter.setJwtGrantedAuthoritiesConverter(jwt -> {
    var roles = (List<String>) jwt.getClaimAsMap("realm_access").get("roles");
    return roles.stream()
        .map(r -> new SimpleGrantedAuthority("ROLE_" + r))
        .collect(toList());
});
```

Flag as **Critical** if: a service has no `SecurityConfig`, uses `permitAll()` as default, or doesn't extract roles from `realm_access`.

---

## 4. Inventory Optimistic Locking (Major)

Any method that modifies inventory quantities **must** handle `ObjectOptimisticLockingFailureException`.

```java
// Required pattern
try {
    inventoryRepository.saveAndFlush(inventory);
} catch (ObjectOptimisticLockingFailureException e) {
    // Publish failure event to trigger saga rollback
    outboxEventRepository.save(new OutboxEvent("InventoryReservationFailedEvent", ...));
}
```

Flag as **Major** if: inventory is saved without this try/catch, or the catch block swallows the exception without publishing a failure event.

---

## 5. Kafka Consumer Group IDs (Major)

Consumer group IDs must match this table (from CLAUDE.md):

| Service | Group ID | Consumes |
|---|---|---|
| product-service | `product-service-order-consumer` | order.created, order.cancelled |
| order-service | `order-service-payment-consumer` | payment.succeeded, payment.failed |
| payment-service | `payment-service-inventory-consumer` | inventory.reserved, inventory.reservation.failed |

If a `KafkaConfig.java` or `@KafkaListener` uses a group ID not matching this table, flag as **Major** and note that CLAUDE.md must also be updated.

---

## 6. API Consistency (Minor)

- Paths must follow `/api/<resource>` pattern (e.g., `/api/orders`, `/api/products`)
- Use correct HTTP verbs: `GET` for reads, `POST` for creates, `PUT`/`PATCH` for updates, `DELETE` for deletes
- Return correct status codes: `201 Created` for POST, `200 OK` for GET/PUT, `204 No Content` for DELETE, `404` for not-found, `400` for validation errors
- IDs in path variables, not query params for resource identification

---

## 7. Transaction Boundaries (Major)

- Service methods that write to multiple repos must be `@Transactional`
- `@Transactional` must be on the **service layer**, not the controller or repository
- Never call a `@Transactional` method from within the same class (Spring proxy bypass — self-invocation breaks transaction)

---

## Review Output Format

Always structure findings as:

```
## Critical
- [file:line] What is wrong → Why it matters → Suggested fix

## Major
- [file:line] What is wrong → Why it matters → Suggested fix

## Minor
- [file:line] What is wrong → Why it matters → Suggested fix

## Summary
N critical, N major, N minor issues found.
```

Do NOT auto-fix. Report findings only and let the developer make changes.
