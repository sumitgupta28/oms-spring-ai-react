CREATE TABLE products (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    price       NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    category    VARCHAR(100),
    sku         VARCHAR(100) NOT NULL UNIQUE,
    image_url   VARCHAR(500),
    vendor_id   UUID,
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category  ON products (category);
CREATE INDEX idx_products_vendor_id ON products (vendor_id);
CREATE INDEX idx_products_active    ON products (active);
