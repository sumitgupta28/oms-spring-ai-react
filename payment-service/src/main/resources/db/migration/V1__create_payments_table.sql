CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID          NOT NULL UNIQUE,
    amount          NUMERIC(12, 2) NOT NULL,
    status          VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    transaction_ref VARCHAR(100),
    failure_reason  VARCHAR(500),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order_id ON payments (order_id);
CREATE INDEX idx_payments_status   ON payments (status);
