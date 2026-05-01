package com.oms.product.kafka.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.shared.events.inventory.InventoryReservationFailedEvent;
import com.oms.shared.events.inventory.InventoryReservedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class InventoryEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishReserved(InventoryReservedEvent event) {
        publish("inventory.reserved", event.getOrderId().toString(), event);
    }

    public void publishReservationFailed(InventoryReservationFailedEvent event) {
        publish("inventory.reservation.failed", event.getOrderId().toString(), event);
    }

    private void publish(String topic, String key, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, key, json)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish to {}: {}", topic, ex.getMessage());
                        } else {
                            log.debug("Published to {} partition={} offset={}",
                                    topic,
                                    result.getRecordMetadata().partition(),
                                    result.getRecordMetadata().offset());
                        }
                    });
        } catch (Exception e) {
            log.error("Serialization error for topic {}: {}", topic, e.getMessage());
        }
    }
}
