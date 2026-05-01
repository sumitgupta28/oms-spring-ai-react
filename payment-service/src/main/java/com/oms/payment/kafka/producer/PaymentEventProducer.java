package com.oms.payment.kafka.producer;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.shared.events.payment.PaymentFailedEvent;
import com.oms.shared.events.payment.PaymentSucceededEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class PaymentEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishSuccess(PaymentSucceededEvent event) {
        publish("payment.succeeded", event.getOrderId().toString(), event);
    }

    public void publishFailure(PaymentFailedEvent event) {
        publish("payment.failed", event.getOrderId().toString(), event);
    }

    private void publish(String topic, String key, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(topic, key, json)
                    .whenComplete((result, ex) -> {
                        if (ex != null) {
                            log.error("Failed to publish to {}: {}", topic, ex.getMessage());
                        } else {
                            log.info("Published {} to topic={}", key, topic);
                        }
                    });
        } catch (Exception e) {
            log.error("Serialization error for topic {}: {}", topic, e.getMessage());
        }
    }
}
