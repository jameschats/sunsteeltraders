-- 011_favicon_background.sql — admin-editable favicon background colour (default: the dark ink navy).
INSERT IGNORE INTO `SiteSettings` (`SettingKey`, `SettingValue`) VALUES ('FaviconBackground', '#1E2430');

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '011_favicon_background.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '011_favicon_background.sql');
