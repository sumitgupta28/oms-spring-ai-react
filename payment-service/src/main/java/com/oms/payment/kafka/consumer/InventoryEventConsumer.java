package com.oms.payment.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.payment.service.PaymentService;
import com.oms.shared.events.inventory.InventoryReservationFailedEvent;
import com.oms.shared.events.inventory.InventoryReservedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class InventoryEventConsumer {

    private final PaymentService paymentService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = {"inventory.reserved", "inventory.reservation.failed"},
            groupId = "payment-service-inventory-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, String> record) {
        log.info("Received event from topic={} key={}", record.topic(), record.key());
        try {
            switch (record.topic()) {
                case "inventory.reserved" -> paymentService.processPayment(
                        objectMapper.readValue(record.value(), InventoryReservedEvent.class));
                case "inventory.reservation.failed" -> paymentService.handleReservationFailed(
                        objectMapper.readValue(record.value(), InventoryReservationFailedEvent.class));
                default -> log.warn("Unhandled topic: {}", record.topic());
            }
        } catch (Exception e) {
            log.error("Failed to process inventory event: {}", e.getMessage(), e);
        }
    }
}
