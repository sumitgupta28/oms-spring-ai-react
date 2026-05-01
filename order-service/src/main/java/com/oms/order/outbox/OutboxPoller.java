package com.oms.order.outbox;

import com.oms.order.entity.OutboxEvent;
import com.oms.order.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Component
@Slf4j
@RequiredArgsConstructor
public class OutboxPoller {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    private static final Map<String, String> EVENT_TOPIC_MAP = Map.of(
            "OrderCreatedEvent",   "order.created",
            "OrderConfirmedEvent", "order.confirmed",
            "OrderCancelledEvent", "order.cancelled"
    );

    @Scheduled(fixedDelay = 2000)
    @Transactional
    public void pollAndPublish() {
        List<OutboxEvent> pending = outboxEventRepository
                .findTop50ByPublishedFalseOrderByCreatedAtAsc();

        if (pending.isEmpty()) return;

        log.debug("Publishing {} outbox events", pending.size());

        pending.forEach(event -> {
            String topic = EVENT_TOPIC_MAP.get(event.getEventType());
            if (topic == null) {
                log.warn("No topic mapping for event type: {}", event.getEventType());
                return;
            }
            try {
                kafkaTemplate.send(topic, event.getAggregateId().toString(), event.getPayload())
                        .whenComplete((result, ex) -> {
                            if (ex != null) {
                                log.error("Failed to publish outbox event {} to {}: {}",
                                        event.getId(), topic, ex.getMessage());
                            } else {
                                log.info("Published {} [orderId={}] to {}",
                                        event.getEventType(), event.getAggregateId(), topic);
                            }
                        });
                event.setPublished(true);
                outboxEventRepository.save(event);
            } catch (Exception e) {
                log.error("Error publishing outbox event {}: {}", event.getId(), e.getMessage());
            }
        });
    }
}
