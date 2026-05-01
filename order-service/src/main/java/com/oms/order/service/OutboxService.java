package com.oms.order.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.oms.order.entity.OutboxEvent;
import com.oms.order.repository.OutboxEventRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class OutboxService {

    private final OutboxEventRepository outboxEventRepository;
    private final ObjectMapper objectMapper;

    public void saveEvent(String aggregateType, UUID aggregateId, String eventType, Object payload) {
        try {
            String json = objectMapper.writeValueAsString(payload);
            OutboxEvent event = OutboxEvent.builder()
                    .aggregateType(aggregateType)
                    .aggregateId(aggregateId)
                    .eventType(eventType)
                    .payload(json)
                    .published(false)
                    .build();
            outboxEventRepository.save(event);
            log.debug("Saved outbox event {} for aggregate {}", eventType, aggregateId);
        } catch (Exception e) {
            log.error("Failed to serialize outbox event {}: {}", eventType, e.getMessage());
            throw new RuntimeException("Failed to save outbox event", e);
        }
    }
}
