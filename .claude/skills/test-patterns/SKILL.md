---
name: test-patterns
description: OMS-specific conventions for writing JUnit 5 + Spring Boot tests, Kafka consumer tests, outbox pattern tests, and optimistic locking tests
---

# OMS Test Patterns

## Test Slice Selection

| Class type | Annotation | When to use |
|---|---|---|
| Full integration | `@SpringBootTest` | End-to-end service behavior, multiple layers |
| REST controller | `@WebMvcTest(MyController.class)` | HTTP layer only, mock service dependencies |
| JPA repository | `@DataJpaTest` | DB queries, constraints, custom query methods |
| Kafka consumer | `@SpringBootTest` + `@EmbeddedKafka` | Consumer logic + event processing |
| Service unit | No Spring context | Pure unit test with Mockito |

## Naming Convention

```
methodName_whenCondition_shouldExpectedBehavior
```

Examples:
- `createOrder_whenProductAvailable_shouldPublishOutboxEvent`
- `reserveInventory_whenConcurrentRequests_shouldThrowOptimisticLockException`
- `processPayment_whenAmountExceedsLimit_shouldPublishPaymentFailed`

## Arrange-Act-Assert Structure

```java
@Test
void methodName_whenCondition_shouldExpectedBehavior() {
    // Arrange
    var input = ...;
    when(mockRepo.findById(id)).thenReturn(Optional.of(entity));

    // Act
    var result = service.doSomething(input);

    // Assert
    assertThat(result.getStatus()).isEqualTo(expectedStatus);
    verify(mockRepo).save(any());
}
```

One test = one logical scenario. Keep assertions focused.

## Mockito for Service Unit Tests

```java
@ExtendWith(MockitoExtension.class)
class OrderServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OutboxEventRepository outboxEventRepository;

    @InjectMocks
    private OrderService orderService;

    @Test
    void createOrder_whenItemsProvided_shouldSaveOrderAndOutboxEvent() {
        // Arrange
        var request = new CreateOrderRequest(...);
        var savedOrder = new Order(...);
        when(orderRepository.save(any())).thenReturn(savedOrder);

        // Act
        orderService.createOrder(request);

        // Assert
        verify(orderRepository).save(any(Order.class));
        verify(outboxEventRepository).save(argThat(event ->
            event.getEventType().equals("OrderCreatedEvent")));
    }
}
```

## Outbox Pattern Testing

Test two things independently:

**1. Transactional write (unit or @DataJpaTest):**
```java
@Test
void createOrder_shouldSaveOutboxEventInSameTransaction() {
    // Verify both order AND outbox event are persisted together
    orderService.createOrder(request);

    assertThat(orderRepository.findAll()).hasSize(1);
    assertThat(outboxEventRepository.findAll())
        .hasSize(1)
        .first()
        .satisfies(e -> {
            assertThat(e.getEventType()).isEqualTo("OrderCreatedEvent");
            assertThat(e.isPublished()).isFalse();
        });
}
```

**2. OutboxPoller publish (unit test):**
```java
@Test
void pollAndPublish_whenUnpublishedEventsExist_shouldPublishAndMarkPublished() {
    var event = new OutboxEvent("OrderCreatedEvent", payload, false);
    when(outboxEventRepository.findByPublishedFalse()).thenReturn(List.of(event));

    outboxPoller.pollAndPublish();

    verify(kafkaTemplate).send(eq("order.created"), any());
    verify(outboxEventRepository).save(argThat(e -> e.isPublished()));
}
```

## Kafka Consumer Testing with @EmbeddedKafka

```java
@SpringBootTest
@EmbeddedKafka(
    partitions = 1,
    topics = {"order.created", "inventory.reserved"},
    brokerProperties = {"listeners=PLAINTEXT://localhost:9092", "port=9092"}
)
class InventoryConsumerTest {

    @Autowired
    private KafkaTemplate<String, Object> kafkaTemplate;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Test
    void onOrderCreated_whenInventorySufficient_shouldReserveAndPublishReserved()
            throws Exception {
        var event = new OrderCreatedEvent(...);

        kafkaTemplate.send("order.created", event).get();

        // Poll until the consumer processes the message
        await().atMost(10, SECONDS).untilAsserted(() ->
            assertThat(inventoryRepository.findBySku("SKU-001"))
                .hasValueSatisfying(inv -> assertThat(inv.getReserved()).isEqualTo(2))
        );
    }
}
```

Use `Awaitility` for async assertions — never `Thread.sleep`.

## Optimistic Locking Test

```java
@Test
void reserveInventory_whenConcurrentRequests_shouldThrowOptimisticLockException()
        throws Exception {
    var inventory = inventoryRepository.save(new Inventory("SKU-001", 10));

    // Simulate two concurrent reads of the same version
    var inv1 = inventoryRepository.findById(inventory.getId()).get();
    var inv2 = inventoryRepository.findById(inventory.getId()).get();

    inv1.setReserved(inv1.getReserved() + 2);
    inventoryRepository.saveAndFlush(inv1); // succeeds, bumps version

    inv2.setReserved(inv2.getReserved() + 2);
    assertThatThrownBy(() -> inventoryRepository.saveAndFlush(inv2))
        .isInstanceOf(ObjectOptimisticLockingFailureException.class);
}
```

## Key Dependencies (already in build.gradle)

- `spring-boot-starter-test` — JUnit 5, Mockito, AssertJ, Spring Test
- `spring-kafka-test` — `@EmbeddedKafka` (order-service, product-service)
- Add `awaitility` to any service using async consumer tests if not present
