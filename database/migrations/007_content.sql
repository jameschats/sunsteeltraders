-- =====================================================================
-- 007_content.sql  —  Pages (one row per public route, carrying SEO),
-- their sections (flexible JSON content), hero slides, FAQs,
-- testimonials and policy pages.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Pages` (
    `PageId`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Slug`            VARCHAR(80)  NOT NULL,          -- '' for home, 'about-us', 'products', ...
    `Title`           VARCHAR(150) NOT NULL,
    `MetaTitle`       VARCHAR(160) NULL,
    `MetaDescription` VARCHAR(320) NULL,
    `OgMediaId`       BIGINT UNSIGNED NULL,
    `UpdatedAt`       DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`PageId`),
    UNIQUE KEY `uq_pages_slug` (`Slug`),
    CONSTRAINT `fk_pages_og` FOREIGN KEY (`OgMediaId`) REFERENCES `MediaAssets` (`MediaId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PageSections` (
    `SectionId`    BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `PageId`       BIGINT UNSIGNED NOT NULL,
    `SectionKey`   VARCHAR(60) NOT NULL,
    `SectionType`  VARCHAR(40) NOT NULL,
    `ContentJson`  JSON NOT NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    `IsVisible`    TINYINT(1) NOT NULL DEFAULT 1,
    `UpdatedAt`    DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`SectionId`),
    UNIQUE KEY `uq_pagesections_key` (`PageId`, `SectionKey`),
    CONSTRAINT `fk_pagesections_page` FOREIGN KEY (`PageId`) REFERENCES `Pages` (`PageId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HeroSlides` (
    `SlideId`      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `PageId`       BIGINT UNSIGNED NOT NULL,
    `MediaId`      BIGINT UNSIGNED NULL,
    `VideoUrl`     VARCHAR(500) NULL,
    `Kicker`       VARCHAR(120) NULL,
    `Headline`     VARCHAR(200) NULL,
    `SubHeadline`  VARCHAR(400) NULL,
    `CtaText`      VARCHAR(60)  NULL,
    `CtaUrl`       VARCHAR(300) NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`SlideId`),
    KEY `ix_heroslides_page` (`PageId`),
    CONSTRAINT `fk_heroslides_page`  FOREIGN KEY (`PageId`)  REFERENCES `Pages` (`PageId`) ON DELETE CASCADE,
    CONSTRAINT `fk_heroslides_media` FOREIGN KEY (`MediaId`) REFERENCES `MediaAssets` (`MediaId`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FAQs for a page, silo or product (FAQPage JSON-LD). Scope: page | silo | product.
CREATE TABLE IF NOT EXISTS `Faqs` (
    `FaqId`        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Scope`        VARCHAR(10)  NOT NULL,
    `ScopeKey`     VARCHAR(120) NOT NULL,           -- page slug, silo key or product slug
    `Question`     VARCHAR(300) NOT NULL,
    `Answer`       VARCHAR(1500) NOT NULL,
    `DisplayOrder` INT NOT NULL DEFAULT 0,
    `IsVisible`    TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`FaqId`),
    KEY `ix_faqs_scope` (`Scope`, `ScopeKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Only real customer quotes, with permission. AggregateRating JSON-LD is never generated from these.
CREATE TABLE IF NOT EXISTS `Testimonials` (
    `TestimonialId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Quote`         VARCHAR(600) NOT NULL,
    `PersonName`    VARCHAR(120) NOT NULL,
    `Company`       VARCHAR(120) NULL,
    `DisplayOrder`  INT NOT NULL DEFAULT 0,
    `IsVisible`     TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (`TestimonialId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `PolicyPages` (
    `Slug`      VARCHAR(80)  NOT NULL,
    `Title`     VARCHAR(150) NOT NULL,
    `BodyHtml`  MEDIUMTEXT   NOT NULL,
    `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`Slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `Pages` (`Slug`,`Title`,`MetaTitle`,`MetaDescription`) VALUES
 ('',                         'Home',                    'Steel, Stainless, Brass & Copper Stockist in Madurai | Sun Steel Traders', 'Multi-metal stockist in Simmakkal, Madurai: 93 grades of mild, alloy and stainless steel, non-ferrous metals, cast iron and plastics. Cut to size, MTC provided, same-day dispatch.'),
 ('about-us',                 'The atelier',             'About Us | Sun Steel Traders, Madurai', 'Three godowns in Simmakkal, Madurai, with band-saw cutting and overhead crane loading. Steel and metals for South India''s workshops.'),
 ('products',                 'The material library',    'Steel & Metal Products | Sun Steel Traders', 'Browse 93 grades across seven material families: mild and structural steel, alloy and tool steel, stainless, non-ferrous, cast iron, plastics and workshop tools.'),
 ('metal-weight-calculator',  'The scale',               'Metal Weight Calculator (Round, Flat, Plate, Pipe) | Sun Steel Traders', 'Calculate the weight of steel, stainless, brass, copper and aluminium rounds, flats, plates, tubes and sections in kg. Free, instant, with formulas shown.'),
 ('catalogue-download',       'Catalogue',               'Download Steel Catalogue & Weight Chart | Sun Steel Traders', 'Download the Sun Steel Traders product catalogue and metal weight chart (PDF).'),
 ('contact-us',               'Concierge',               'Contact & Request a Quote | Sun Steel Traders, Madurai', 'Send your cut list or drawing for a same-day quote. Call, WhatsApp or visit our godowns in Simmakkal, Madurai.'),
 ('terms-conditions',         'Terms & conditions',      'Terms & Conditions | Sun Steel Traders', NULL),
 ('privacy-policy',           'Privacy policy',          'Privacy Policy | Sun Steel Traders', NULL);

INSERT INTO `HeroSlides` (`PageId`,`Kicker`,`Headline`,`SubHeadline`,`CtaText`,`CtaUrl`,`DisplayOrder`)
SELECT PageId, 'Multi-metal stockist · Madurai', 'Ninety-three grades. One house.',
       'Steel, stainless, brass, copper, cast iron and engineering plastics, cut to your size in our Simmakkal godowns and dispatched the same day.',
       'Speak to the concierge', '/contact-us/', 1
FROM Pages WHERE Slug = '' AND NOT EXISTS (SELECT 1 FROM HeroSlides h JOIN Pages p ON p.PageId = h.PageId WHERE p.Slug = '');

INSERT INTO `Faqs` (`Scope`,`ScopeKey`,`Question`,`Answer`,`DisplayOrder`)
SELECT * FROM (SELECT
 'page' s,'' k,'Do you cut material to size?' q,'Yes. Rounds, flats and blocks are band-saw cut to your lengths (±1 mm); plates are cut to size on request.' a,1 o UNION ALL SELECT
 'page','','Do you provide mill test certificates?','Yes. Mill Test Certificates (MTC) are available for every lot on request.',2 UNION ALL SELECT
 'page','','How fast can you deliver?','Same day within Madurai, Virudhunagar and Sivakasi; one day to Tirunelveli, Tuticorin and Trichy; two to three days to Chennai and Hosur.',3) x
WHERE NOT EXISTS (SELECT 1 FROM Faqs);

INSERT IGNORE INTO `PolicyPages` (`Slug`,`Title`,`BodyHtml`) VALUES
 ('terms-conditions','Terms & conditions','<h2>Quotations</h2><p>Quotations are valid for 3 days unless stated, because metal prices move daily. Prices are ex-godown Madurai plus GST.</p><h2>Weights</h2><p>Calculated weights are theoretical; invoices use actual weighed or mill weights.</p>'),
 ('privacy-policy','Privacy policy','<h2>What we collect</h2><p>Your name, phone, email, company, GSTIN and the items you ask about when you send a request.</p><h2>How we use it</h2><p>Only to reply to you with a quotation. We do not sell or share your details.</p>');

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '007_content.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '007_content.sql');
