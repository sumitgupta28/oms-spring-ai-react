package com.oms.order.kafka.consumer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.order.service.OrderService;
import com.oms.shared.events.payment.PaymentFailedEvent;
import com.oms.shared.events.payment.PaymentSucceededEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentEventConsumer {

    private final OrderService orderService;
    private final ObjectMapper objectMapper;

    @KafkaListener(
            topics = {"payment.succeeded", "payment.failed"},
            groupId = "order-service-payment-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consume(ConsumerRecord<String, String> record) {
        log.info("Received event from topic={} key={}", record.topic(), record.key());
        try {
            switch (record.topic()) {
                case "payment.succeeded" -> orderService.confirmOrder(
                        objectMapper.readValue(record.value(), PaymentSucceededEvent.class));
                case "payment.failed" -> orderService.cancelOrder(
                        objectMapper.readValue(record.value(), PaymentFailedEvent.class));
                default -> log.warn("Unhandled topic: {}", record.topic());
            }
        } catch (Exception e) {
            log.error("Failed to process payment event: {}", e.getMessage(), e);
        }
    }
}
