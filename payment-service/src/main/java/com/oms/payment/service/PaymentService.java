package com.oms.payment.service;

import com.oms.payment.entity.Payment;
import com.oms.payment.kafka.producer.PaymentEventProducer;
import com.oms.payment.repository.PaymentRepository;
import com.oms.shared.enums.PaymentStatus;
import com.oms.shared.events.inventory.InventoryReservationFailedEvent;
import com.oms.shared.events.inventory.InventoryReservedEvent;
import com.oms.shared.events.payment.PaymentFailedEvent;
import com.oms.shared.events.payment.PaymentSucceededEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Random;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final PaymentEventProducer paymentEventProducer;
    private final Random random = new Random();

    @Transactional
    public void processPayment(InventoryReservedEvent event) {
        // Idempotency: skip if already processed
        if (paymentRepository.findByOrderId(event.getOrderId()).isPresent()) {
            log.warn("Payment already exists for order {}, skipping", event.getOrderId());
            return;
        }

        log.info("Processing payment for order {} amount={}", event.getOrderId(), event.getTotalAmount());

        Payment payment = Payment.builder()
                .orderId(event.getOrderId())
                .amount(event.getTotalAmount())
                .status(PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        // Mock: 90% success rate
        boolean success = random.nextInt(10) < 9;

        if (success) {
            payment.setStatus(PaymentStatus.SUCCEEDED);
            payment.setTransactionRef("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            paymentRepository.save(payment);

            paymentEventProducer.publishSuccess(PaymentSucceededEvent.builder()
                    .orderId(event.getOrderId())
                    .customerId(event.getCustomerId())
                    .paymentId(payment.getId())
                    .amount(payment.getAmount())
                    .transactionRef(payment.getTransactionRef())
                    .succeededAt(Instant.now())
                    .build());

            log.info("Payment SUCCEEDED for order {} txn={}", event.getOrderId(), payment.getTransactionRef());
        } else {
            payment.setStatus(PaymentStatus.FAILED);
            payment.setFailureReason("Insufficient funds (simulated)");
            paymentRepository.save(payment);

            paymentEventProducer.publishFailure(PaymentFailedEvent.builder()
                    .orderId(event.getOrderId())
                    .customerId(event.getCustomerId())
                    .failureReason(payment.getFailureReason())
                    .items(event.getItems())
                    .failedAt(Instant.now())
                    .build());

            log.warn("Payment FAILED for order {}", event.getOrderId());
        }
    }

    @Transactional
    public void handleReservationFailed(InventoryReservationFailedEvent event) {
        log.info("Inventory reservation failed for order {} — reason: {}", event.getOrderId(), event.getReason());
        // No payment record created; order-service already handles cancellation via PaymentFailedEvent
        // We publish a PaymentFailed so order-service transitions to CANCELLED consistently
        paymentEventProducer.publishFailure(PaymentFailedEvent.builder()
                .orderId(event.getOrderId())
                .customerId(event.getCustomerId())
                .failureReason("Inventory reservation failed: " + event.getReason())
                .items(java.util.List.of())
                .failedAt(Instant.now())
                .build());
    }
}
