CREATE TABLE user_payment_methods (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id   VARCHAR(36) NOT NULL,
    nickname      VARCHAR(50),
    card_type     VARCHAR(20)  NOT NULL,
    last_four     VARCHAR(4)   NOT NULL,
    expiry_month  INTEGER      NOT NULL,
    expiry_year   INTEGER      NOT NULL,
    is_default    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_payment_keycloak ON user_payment_methods(keycloak_id);
