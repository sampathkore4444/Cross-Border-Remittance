BEGIN;

CREATE INDEX idx_autosends_recipient ON autosends(recipient_id);
CREATE INDEX idx_float_txns_type ON float_transactions(type);

COMMIT;
