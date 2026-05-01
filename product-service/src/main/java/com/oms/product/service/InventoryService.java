package com.oms.product.service;

import com.oms.product.entity.Inventory;
import com.oms.product.exception.ProductNotFoundException;
import com.oms.product.kafka.producer.InventoryEventProducer;
import com.oms.product.repository.InventoryRepository;
import com.oms.shared.dto.OrderItemDto;
import com.oms.shared.events.inventory.InventoryReservationFailedEvent;
import com.oms.shared.events.inventory.InventoryReservedEvent;
import com.oms.shared.events.order.OrderCancelledEvent;
import com.oms.shared.events.order.OrderCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryRepository inventoryRepository;
    private final InventoryEventProducer inventoryEventProducer;

    @Transactional
    public void reserveInventory(OrderCreatedEvent event) {
        log.info("Reserving inventory for order {}", event.getOrderId());
        List<Inventory> toSave = new ArrayList<>();

        try {
            for (OrderItemDto item : event.getItems()) {
                Inventory inv = inventoryRepository
                        .findByProductIdForUpdate(item.getProductId())
                        .orElseThrow(() -> new ProductNotFoundException(item.getProductId()));

                int available = inv.getQuantity() - inv.getReservedQuantity();
                if (available < item.getQuantity()) {
                    log.warn("Insufficient inventory for product {} (need={}, available={})",
                            item.getProductId(), item.getQuantity(), available);
                    rollbackReservations(toSave);
                    inventoryEventProducer.publishReservationFailed(
                            InventoryReservationFailedEvent.builder()
                                    .orderId(event.getOrderId())
                                    .customerId(event.getCustomerId())
                                    .reason("Insufficient stock for product: " + item.getProductId())
                                    .failedAt(Instant.now())
                                    .build());
                    return;
                }

                inv.setReservedQuantity(inv.getReservedQuantity() + item.getQuantity());
                toSave.add(inv);
            }

            inventoryRepository.saveAll(toSave);

            inventoryEventProducer.publishReserved(
                    InventoryReservedEvent.builder()
                            .orderId(event.getOrderId())
                            .customerId(event.getCustomerId())
                            .items(event.getItems())
                            .totalAmount(event.getTotalAmount())
                            .reservedAt(Instant.now())
                            .build());

            log.info("Inventory reserved successfully for order {}", event.getOrderId());

        } catch (ObjectOptimisticLockingFailureException ex) {
            log.error("Concurrent modification for order {}, publishing failure", event.getOrderId());
            inventoryEventProducer.publishReservationFailed(
                    InventoryReservationFailedEvent.builder()
                            .orderId(event.getOrderId())
                            .customerId(event.getCustomerId())
                            .reason("Concurrent inventory modification, please retry")
                            .failedAt(Instant.now())
                            .build());
        }
    }

    @Transactional
    public void releaseInventory(OrderCancelledEvent event) {
        log.info("Releasing inventory for cancelled order {}", event.getOrderId());
        for (OrderItemDto item : event.getItems()) {
            inventoryRepository.findByProductId(item.getProductId()).ifPresentOrElse(inv -> {
                int newReserved = Math.max(0, inv.getReservedQuantity() - item.getQuantity());
                inv.setReservedQuantity(newReserved);
                inventoryRepository.save(inv);
                log.debug("Released {} units for product {}", item.getQuantity(), item.getProductId());
            }, () -> log.warn("Inventory not found for product {} during release", item.getProductId()));
        }
    }

    private void rollbackReservations(List<Inventory> reserved) {
        // No-op: transaction will be rolled back, partial reservations not yet saved
        log.debug("Rolling back partial reservations for {} items", reserved.size());
    }
}
