-- =====================================================================
-- 006_catalog.sql  —  The seven silos, materials (densities for the weight
-- calculator), the 93 products, IS 808 section weights and city pages.
-- Product URLs are /products/{SiloKey}/{Slug}/ and must never change.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Silos` (
    `SiloId`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `SiloKey`         VARCHAR(80)  NOT NULL,             -- URL segment, e.g. 'alloy-engineering-steels'
    `Name`            VARCHAR(120) NOT NULL,
    `ShortName`       VARCHAR(60)  NOT NULL,
    `Glyph`           VARCHAR(20)  NOT NULL DEFAULT 'round',
    `Intro`           VARCHAR(600) NULL,
    `TopGrades`       VARCHAR(200) NULL,
    `HeroMediaId`     BIGINT UNSIGNED NULL,
    `MetaTitle`       VARCHAR(160) NULL,                 -- NULL = use the formula in §5.3
    `MetaDescription` VARCHAR(320) NULL,
    `DisplayOrder`    INT NOT NULL DEFAULT 0,
    `UpdatedAt`       DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`SiloId`),
    UNIQUE KEY `uq_silos_key` (`SiloKey`),
    CONSTRAINT `fk_silos_media` FOREIGN KEY (`HeroMediaId`) REFERENCES `MediaAssets` (`MediaId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Materials` (
    `MaterialKey` VARCHAR(20)  NOT NULL,                 -- 'ms', 'alloy', 'ss300', 'brass', ...
    `Name`        VARCHAR(80)  NOT NULL,
    `Density`     DECIMAL(6,3) NOT NULL,                 -- g/cm³
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`MaterialKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Products` (
    `ProductId`       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `SiloId`          BIGINT UNSIGNED NOT NULL,
    `Slug`            VARCHAR(120) NOT NULL,
    `Sku`             VARCHAR(20)  NOT NULL,
    `Name`            VARCHAR(160) NOT NULL,
    `Grade`           VARCHAR(60)  NOT NULL,
    `MaterialKey`     VARCHAR(20)  NULL,                 -- NULL for tools (no weight calculator)
    `Forms`           VARCHAR(120) NOT NULL DEFAULT '',  -- csv: round,square,hex,flat,plate,tube,rect,angle,channel,beam
    `SizeRange`       VARCHAR(200) NULL,
    `Applications`    VARCHAR(400) NULL,
    `Summary`         VARCHAR(600) NULL,
    `Condition`       VARCHAR(120) NULL,
    `Machinability`   VARCHAR(20)  NULL,
    `ChemistryJson`   JSON NULL,                         -- [{"el":"C","min":"0.36","max":"0.44"}]
    `MechanicalJson`  JSON NULL,                         -- [{"k":"Tensile","v":"850–1000 MPa"}]
    `EquivalentsJson` JSON NULL,                         -- ["BS 817M40","AISI 4340",...]
    `StockStatus`     VARCHAR(12)  NOT NULL DEFAULT 'In stock',  -- In stock | Limited | On order
    `PriceNote`       VARCHAR(120) NULL,                 -- shown only when set; JSON-LD price only when real
    `HeroMediaId`     BIGINT UNSIGNED NULL,
    `MetaTitle`       VARCHAR(160) NULL,
    `MetaDescription` VARCHAR(320) NULL,
    `IsPublished`     TINYINT(1) NOT NULL DEFAULT 1,
    `DisplayOrder`    INT NOT NULL DEFAULT 0,
    `CreatedAt`       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt`       DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`ProductId`),
    UNIQUE KEY `uq_products_slug` (`Slug`),
    UNIQUE KEY `uq_products_sku` (`Sku`),
    KEY `ix_products_silo` (`SiloId`, `DisplayOrder`),
    FULLTEXT KEY `ft_products_search` (`Name`, `Grade`, `Applications`),
    CONSTRAINT `fk_products_silo`     FOREIGN KEY (`SiloId`)      REFERENCES `Silos` (`SiloId`),
    CONSTRAINT `fk_products_material` FOREIGN KEY (`MaterialKey`) REFERENCES `Materials` (`MaterialKey`),
    CONSTRAINT `fk_products_media`    FOREIGN KEY (`HeroMediaId`) REFERENCES `MediaAssets` (`MediaId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ProductImages` (
    `ProductId`    BIGINT UNSIGNED NOT NULL,
    `MediaId`      BIGINT UNSIGNED NOT NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`ProductId`, `MediaId`),
    CONSTRAINT `fk_productimages_product` FOREIGN KEY (`ProductId`) REFERENCES `Products` (`ProductId`) ON DELETE CASCADE,
    CONSTRAINT `fk_productimages_media`   FOREIGN KEY (`MediaId`)   REFERENCES `MediaAssets` (`MediaId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IS 808 rolled sections: kg per metre for beams and channels.
CREATE TABLE IF NOT EXISTS `SectionWeights` (
    `Designation` VARCHAR(20)  NOT NULL,                 -- 'ISMB 300'
    `Kind`        VARCHAR(10)  NOT NULL,                 -- beam | channel
    `KgPerMetre`  DECIMAL(8,2) NOT NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`Designation`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Regional landing pages: /steel-suppliers-{Slug}/ (slugs are lowercase).
CREATE TABLE IF NOT EXISTS `Cities` (
    `CityId`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Slug`            VARCHAR(60)  NOT NULL,
    `Name`            VARCHAR(80)  NOT NULL,
    `DistanceKm`      INT NOT NULL DEFAULT 0,
    `LeadTime`        VARCHAR(30)  NULL,
    `Zones`           VARCHAR(300) NULL,
    `Intro`           VARCHAR(600) NULL,
    `IndustriesJson`  JSON NULL,
    `PopularSlugsJson` JSON NULL,
    `MetaTitle`       VARCHAR(160) NULL,
    `MetaDescription` VARCHAR(320) NULL,
    `IsPublished`     TINYINT(1) NOT NULL DEFAULT 1,
    `DisplayOrder`    INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`CityId`),
    UNIQUE KEY `uq_cities_slug` (`Slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `DeliveryLeadTimes` (
    `City`         VARCHAR(80) NOT NULL,
    `LeadTime`     VARCHAR(30) NOT NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`City`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '006_catalog.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '006_catalog.sql');
