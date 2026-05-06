CREATE TABLE user_profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keycloak_id   VARCHAR(36) NOT NULL UNIQUE,
    phone         VARCHAR(20),
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
