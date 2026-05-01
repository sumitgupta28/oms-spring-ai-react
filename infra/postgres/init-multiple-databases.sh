#!/bin/sh
set -e

# The 'oms' database is auto-created by POSTGRES_DB env var.
# This script creates the keycloak database and per-service schemas inside 'oms'.

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE keycloak;
    GRANT ALL PRIVILEGES ON DATABASE keycloak TO "$POSTGRES_USER";
EOSQL
echo "Created database: keycloak"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE SCHEMA IF NOT EXISTS products;
    CREATE SCHEMA IF NOT EXISTS orders;
    CREATE SCHEMA IF NOT EXISTS payments;
    GRANT ALL ON SCHEMA products TO "$POSTGRES_USER";
    GRANT ALL ON SCHEMA orders  TO "$POSTGRES_USER";
    GRANT ALL ON SCHEMA payments TO "$POSTGRES_USER";
EOSQL
echo "Created schemas: products, orders, payments in database $POSTGRES_DB"
