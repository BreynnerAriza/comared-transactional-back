-- Script de creación de tablas (base de datos limpia, PostgreSQL 13+)

BEGIN;

CREATE TABLE app_user (
    id            uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
    name          varchar(150) NOT NULL,
    email         varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now(),
    updated_at    timestamptz  NOT NULL DEFAULT now(),
    CONSTRAINT uk_app_user_email UNIQUE (email)
);

CREATE TABLE recharge (
    id               uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid          NOT NULL,
    supplier_id      varchar(50)   NOT NULL,
    supplier_name    varchar(150)  NOT NULL,
    cell_phone       varchar(10)   NOT NULL,
    amount           numeric(12,2) NOT NULL,
    status           varchar(20)   NOT NULL DEFAULT 'PENDING',
    transactional_id varchar(100),
    provider_message text,
    created_at       timestamptz   NOT NULL DEFAULT now(),
    updated_at       timestamptz   NOT NULL DEFAULT now(),
    CONSTRAINT fk_recharge_user FOREIGN KEY (user_id)
        REFERENCES app_user (id) ON DELETE RESTRICT,
    CONSTRAINT ck_recharge_status
        CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'UNKNOWN'))
);

CREATE UNIQUE INDEX uk_recharge_transactional_id ON recharge (transactional_id);
CREATE INDEX idx_recharge_user_id ON recharge (user_id);

COMMIT;
