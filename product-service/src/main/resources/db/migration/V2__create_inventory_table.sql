CREATE TABLE inventory (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID NOT NULL UNIQUE REFERENCES products (id) ON DELETE CASCADE,
    quantity          INT  NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    reserved_quantity INT  NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    version           BIGINT NOT NULL DEFAULT 0,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_inventory_product_id ON inventory (product_id);
