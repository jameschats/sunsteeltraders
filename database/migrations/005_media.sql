-- =====================================================================
-- 005_media.sql  —  Every uploaded image or video. VariantsJson holds the
-- WebP sizes, e.g. {"480":"/uploads/2026/10/ab12-480.webp", ...}.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `MediaAssets` (
    `MediaId`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Kind`         VARCHAR(10)  NOT NULL DEFAULT 'image',   -- image | video
    `FileName`     VARCHAR(255) NOT NULL,
    `OriginalUrl`  VARCHAR(500) NOT NULL,
    `VariantsJson` JSON NULL,
    `Placeholder`  VARCHAR(1500) NULL,                      -- tiny blurred data URI
    `Width`        INT NULL,
    `Height`       INT NULL,
    `SizeBytes`    BIGINT NOT NULL DEFAULT 0,
    `AltText`      VARCHAR(300) NULL,
    `Caption`      VARCHAR(300) NULL,
    `Category`     VARCHAR(40)  NULL,                       -- Products | Godown | Team | Hero | Catalogue
    `UploadedBy`   BIGINT UNSIGNED NULL,
    `CreatedAt`    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt`    DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`MediaId`),
    KEY `ix_media_category` (`Category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '005_media.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '005_media.sql');
