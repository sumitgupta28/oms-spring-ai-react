package com.oms.product.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.product.service.InventoryService;
import com.oms.shared.events.order.OrderCancelledEvent;
import com.oms.shared.events.order.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventConsumer {

    private final InventoryService inventoryService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = {"order.created", "order.cancelled"},
            groupId = "product-service-order-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, String> record) {
        log.info("Received event from topic={} key={}", record.topic(), record.key());
        try {
            switch (record.topic()) {
                case "order.created" -> inventoryService.reserveInventory(
                        objectMapper.readValue(record.value(), OrderCreatedEvent.class));
                case "order.cancelled" -> inventoryService.releaseInventory(
                        objectMapper.readValue(record.value(), OrderCancelledEvent.class));
                default -> log.warn("Unhandled topic: {}", record.topic());
            }
        } catch (Exception e) {
            log.error("Failed to process event from topic={}: {}", record.topic(), e.getMessage(), e);
        }
    }
}
