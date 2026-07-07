ALTER TABLE delegations ADD COLUMN original_quantity INT NOT NULL DEFAULT 0 AFTER quantity;
UPDATE delegations SET original_quantity = quantity WHERE original_quantity = 0;
UPDATE users SET password = '$2a$12$V2UMmXQQgVl2ZAlVp8b64.SjwsrLRdz6TUIj7LbaJ7QGvmi3JgfNe';
