-- =====================================================================
-- 009_audit.sql  —  Who changed what in the admin panel.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `AuditLog` (
    `AuditId`   BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `UserId`    BIGINT UNSIGNED NULL,
    `Action`    VARCHAR(40)  NOT NULL,     -- Create | Update | Delete | Login | ...
    `Entity`    VARCHAR(60)  NOT NULL,
    `EntityId`  VARCHAR(60)  NULL,
    `Summary`   VARCHAR(500) NULL,
    `At`        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`AuditId`),
    KEY `ix_audit_at` (`At`),
    KEY `ix_audit_entity` (`Entity`, `EntityId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '009_audit.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '009_audit.sql');
