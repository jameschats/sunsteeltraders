-- =====================================================================
-- 004_site_and_theme.sql  —  Key/value site settings and the three
-- theme colours (Primary, Accent, Surface) the whole site is built on.
-- Defaults are the v3 "Metal atelier" palette: ink navy, bronze, ivory.
-- =====================================================================
CREATE TABLE IF NOT EXISTS `SiteSettings` (
    `SettingKey`   VARCHAR(60)   NOT NULL,
    `SettingValue` VARCHAR(2000) NULL,
    `UpdatedAt`    DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`SettingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ThemeSettings` (
    `SettingKey`   VARCHAR(60)  NOT NULL,
    `SettingValue` VARCHAR(200) NULL,
    `UpdatedAt`    DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`SettingKey`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO `ThemeSettings` (`SettingKey`, `SettingValue`) VALUES
 ('PrimaryColor', '#1E2430'),
 ('AccentColor',  '#9C6B3C'),
 ('SurfaceColor', '#FAF6EF');

-- Values marked TO CONFIRM are placeholders the owner must check before launch.
INSERT IGNORE INTO `SiteSettings` (`SettingKey`, `SettingValue`) VALUES
 ('BusinessName',    'Sun Steel Traders'),
 ('LocationLine',    'Madurai'),
 ('Tagline',         'Multi-metal stockist'),
 ('Phone1',          '+91 98421 50479'),
 ('Phone2',          '+91 98428 50479'),
 ('Landline',        '0452 235 0479'),
 ('WhatsAppNumber',  '919842150479'),
 ('WhatsAppMessage', 'Hello Sun Steel Traders, I would like a price and availability check.'),
 ('SalesEmail',      'managersunsteeltraders@gmail.com'),
 ('Address',         '57, Tamil Sangam Road, near Bell Hotel, Simmakkal, Madurai 625001, Tamil Nadu'),
 ('MapUrl',          'https://maps.google.com/?q=Sun+Steel+Traders+Simmakkal+Madurai'),
 ('Latitude',        '9.9252'),
 ('Longitude',       '78.1198'),
 ('OpeningHours',    'Mon–Sat · 09:00–19:30'),
 ('Gstin',           NULL),
 ('Udyam',           NULL),
 ('IsoCertificate',  'ISO 9001:2015'),
 ('FoundedYear',     NULL),
 ('LogoLightUrl',    NULL),
 ('LogoDarkUrl',     NULL),
 ('FaviconUrl',      NULL),
 ('FacebookUrl',     NULL),
 ('InstagramUrl',    NULL),
 ('YouTubeUrl',      NULL),
 ('LinkedInUrl',     NULL),
 ('CatalogueUrl',    NULL),                -- PDF shown after the catalogue form
 ('GoogleClientId',  NULL);

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '004_site_and_theme.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '004_site_and_theme.sql');
