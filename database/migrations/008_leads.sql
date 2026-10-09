-- =====================================================================
-- 008_leads.sql  —  One inbox for RFQs, catalogue downloads, contact
-- messages and call-backs. A lead is saved before WhatsApp opens, so
-- nothing is lost if the customer never presses Send in WhatsApp.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Leads` (
    `LeadId`     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Reference`  VARCHAR(20)  NOT NULL,                  -- SST-RFQ-1043, SST-CAT-0311
    `Type`       VARCHAR(10)  NOT NULL,                  -- RFQ | Catalogue | Contact | Callback
    `Status`     VARCHAR(12)  NOT NULL DEFAULT 'New',    -- New | Contacted | Quoted | Won | Lost
    `Channel`    VARCHAR(12)  NOT NULL DEFAULT 'Web',    -- Web | WhatsApp | Email | Phone
    `Name`       VARCHAR(150) NOT NULL,
    `Company`    VARCHAR(150) NULL,
    `Gstin`      VARCHAR(15)  NULL,
    `Phone`      VARCHAR(30)  NOT NULL,
    `Email`      VARCHAR(256) NULL,
    `City`       VARCHAR(80)  NULL,
    `Industry`   VARCHAR(80)  NULL,
    `Message`    TEXT NULL,
    `CallbackAt` DATETIME NULL,
    `TotalKg`    DECIMAL(12,2) NULL,
    `SourcePage` VARCHAR(200) NULL,
    `UtmSource`  VARCHAR(80)  NULL,
    `ClientIp`   VARCHAR(45)  NULL,
    `AssignedTo` BIGINT UNSIGNED NULL,
    `CreatedAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt`  DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`LeadId`),
    UNIQUE KEY `uq_leads_reference` (`Reference`),
    KEY `ix_leads_type_status` (`Type`, `Status`),
    KEY `ix_leads_created` (`CreatedAt`),
    KEY `ix_leads_phone` (`Phone`),
    CONSTRAINT `fk_leads_assigned` FOREIGN KEY (`AssignedTo`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `LeadItems` (
    `LeadItemId`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `LeadId`      BIGINT UNSIGNED NOT NULL,
    `ProductId`   BIGINT UNSIGNED NULL,
    `GradeText`   VARCHAR(160) NOT NULL,                 -- kept even if the product is later renamed
    `Form`        VARCHAR(12)  NOT NULL,
    `DimsJson`    JSON NULL,                             -- {"D":80}
    `DimsText`    VARCHAR(80)  NOT NULL,                 -- 'Ø80'
    `LengthMm`    DECIMAL(10,1) NULL,
    `Quantity`    INT NOT NULL DEFAULT 1,
    `Kg`          DECIMAL(12,2) NULL,
    `CutToSize`   TINYINT(1) NOT NULL DEFAULT 0,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`LeadItemId`),
    KEY `ix_leaditems_lead` (`LeadId`),
    CONSTRAINT `fk_leaditems_lead`    FOREIGN KEY (`LeadId`)    REFERENCES `Leads` (`LeadId`) ON DELETE CASCADE,
    CONSTRAINT `fk_leaditems_product` FOREIGN KEY (`ProductId`) REFERENCES `Products` (`ProductId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `LeadFiles` (
    `LeadFileId`  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `LeadId`      BIGINT UNSIGNED NOT NULL,
    `FileName`    VARCHAR(255) NOT NULL,
    `StoredPath`  VARCHAR(500) NOT NULL,                 -- outside the public uploads folder
    `ContentType` VARCHAR(100) NOT NULL,
    `SizeBytes`   BIGINT NOT NULL DEFAULT 0,
    `CreatedAt`   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`LeadFileId`),
    KEY `ix_leadfiles_lead` (`LeadId`),
    CONSTRAINT `fk_leadfiles_lead` FOREIGN KEY (`LeadId`) REFERENCES `Leads` (`LeadId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `LeadNotes` (
    `LeadNoteId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `LeadId`     BIGINT UNSIGNED NOT NULL,
    `UserId`     BIGINT UNSIGNED NULL,
    `Note`       VARCHAR(2000) NOT NULL,
    `CreatedAt`  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`LeadNoteId`),
    KEY `ix_leadnotes_lead` (`LeadId`),
    CONSTRAINT `fk_leadnotes_lead` FOREIGN KEY (`LeadId`) REFERENCES `Leads` (`LeadId`) ON DELETE CASCADE,
    CONSTRAINT `fk_leadnotes_user` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anonymous click counts for the dashboard (WhatsApp, call, catalogue).
CREATE TABLE IF NOT EXISTS `ClickEvents` (
    `ClickEventId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Kind`         VARCHAR(12)  NOT NULL,                -- wa | call | email | map
    `Page`         VARCHAR(200) NULL,
    `At`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`ClickEventId`),
    KEY `ix_clickevents_at` (`At`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '008_leads.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '008_leads.sql');
