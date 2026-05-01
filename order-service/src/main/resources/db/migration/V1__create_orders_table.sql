CREATE TABLE orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id      UUID         NOT NULL,
    status           VARCHAR(30)  NOT NULL DEFAULT 'PENDING',
    total_amount     NUMERIC(12, 2) NOT NULL,
    shipping_address JSONB,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_customer_id ON orders (customer_id);
CREATE INDEX idx_orders_status      ON orders (status);
