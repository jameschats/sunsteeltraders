-- =====================================================================
-- 003_identity_seed.sql  —  Permissions, the three staff roles, and the
-- first Super Admin. The admin's PasswordHash is a placeholder that
-- SuperAdminSeeder replaces on first API start (Admin:Email /
-- Admin:DefaultPassword), with MustChangePassword = 1.
-- =====================================================================
INSERT IGNORE INTO `Permissions` (`Code`, `Name`, `Module`) VALUES
 ('lead.manage',     'Manage RFQs and enquiries',   'Leads'),
 ('catalog.manage',  'Manage products and prices',  'Catalogue'),
 ('stock.manage',    'Update stock status',         'Stock'),
 ('media.manage',    'Manage photographs and files','Media'),
 ('cms.manage',      'Manage pages and content',    'Content'),
 ('theme.manage',    'Change theme colours',        'Theme'),
 ('settings.manage', 'Change site settings and SEO','Settings'),
 ('user.manage',     'Manage staff users and roles','Users');

INSERT IGNORE INTO `Roles` (`Name`, `NormalizedName`, `Description`, `IsSystem`) VALUES
 ('Super Admin', 'SUPER ADMIN', 'Everything, including staff users', 1),
 ('Manager',     'MANAGER',     'Catalogue, stock, content, media, theme and leads', 1),
 ('Sales',       'SALES',       'Leads and stock status', 1);

INSERT IGNORE INTO `RolePermissions` (`RoleId`, `PermissionId`)
SELECT r.RoleId, p.PermissionId FROM Roles r JOIN Permissions p
WHERE r.NormalizedName = 'SUPER ADMIN';

INSERT IGNORE INTO `RolePermissions` (`RoleId`, `PermissionId`)
SELECT r.RoleId, p.PermissionId FROM Roles r JOIN Permissions p
WHERE r.NormalizedName = 'MANAGER'
  AND p.Code IN ('lead.manage','catalog.manage','stock.manage','media.manage','cms.manage','theme.manage');

INSERT IGNORE INTO `RolePermissions` (`RoleId`, `PermissionId`)
SELECT r.RoleId, p.PermissionId FROM Roles r JOIN Permissions p
WHERE r.NormalizedName = 'SALES' AND p.Code IN ('lead.manage','stock.manage');

INSERT IGNORE INTO `Users` (`Email`, `NormalizedEmail`, `PasswordHash`, `FullName`, `IsActive`, `MustChangePassword`)
VALUES ('admin@sunsteeltraders.com', 'ADMIN@SUNSTEELTRADERS.COM', 'SET_BY_SEEDER', 'Site Administrator', 1, 1);

INSERT IGNORE INTO `UserRoles` (`UserId`, `RoleId`)
SELECT u.UserId, r.RoleId FROM Users u JOIN Roles r
WHERE u.NormalizedEmail = 'ADMIN@SUNSTEELTRADERS.COM' AND r.NormalizedName = 'SUPER ADMIN';

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '003_identity_seed.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '003_identity_seed.sql');
