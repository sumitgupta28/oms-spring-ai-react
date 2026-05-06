CREATE TABLE user_addresses (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id   VARCHAR(36) NOT NULL,
    label         VARCHAR(50)  NOT NULL DEFAULT 'Home',
    full_name     VARCHAR(100) NOT NULL,
    street        VARCHAR(200) NOT NULL,
    city          VARCHAR(100) NOT NULL,
    state         VARCHAR(100) NOT NULL,
    zip_code      VARCHAR(20)  NOT NULL,
    country       VARCHAR(100) NOT NULL DEFAULT 'US',
    phone         VARCHAR(20),
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_addresses_keycloak ON user_addresses(keycloak_id);
