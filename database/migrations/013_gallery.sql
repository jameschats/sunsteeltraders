-- 013_gallery.sql — the sliding photo gallery on the home page (photos come from the media library).
CREATE TABLE IF NOT EXISTS `GalleryItems` (
    `GalleryItemId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `MediaId`       BIGINT UNSIGNED NOT NULL,
    `Title`         VARCHAR(120) NULL,
    `Caption`       VARCHAR(300) NULL,
    `LinkUrl`       VARCHAR(300) NULL,
    `DisplayOrder`  INT NOT NULL DEFAULT 0,
    `IsVisible`     TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`GalleryItemId`),
    KEY `ix_gallery_order` (`DisplayOrder`),
    CONSTRAINT `fk_gallery_media` FOREIGN KEY (`MediaId`) REFERENCES `MediaAssets` (`MediaId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `SiteSettings` (`SettingKey`, `SettingValue`) VALUES
 ('GalleryShow', '1'), ('GalleryKicker', 'Around the godown'), ('GalleryHeading', 'A look inside Sun Steel Traders'), ('GallerySpeed', '50');

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '013_gallery.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '013_gallery.sql');
