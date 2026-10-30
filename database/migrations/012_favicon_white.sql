-- 012_favicon_white.sql — favicon box is white by default (still editable in admin Site settings).
UPDATE `SiteSettings` SET `SettingValue` = '#FFFFFF' WHERE `SettingKey` = 'FaviconBackground' AND `SettingValue` = '#1E2430';

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '012_favicon_white.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '012_favicon_white.sql');
