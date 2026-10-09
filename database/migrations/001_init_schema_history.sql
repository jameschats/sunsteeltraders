-- =====================================================================
-- 001_init_schema_history.sql
-- Records which migration scripts have been applied. Forward-only:
-- never edit an applied script; add a new higher-numbered one.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `__schema_migrations` (
    `id`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `script_name` VARCHAR(255) NOT NULL,
    `applied_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `checksum`    CHAR(64)     NULL,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_schema_migrations_script` (`script_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '001_init_schema_history.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '001_init_schema_history.sql');
