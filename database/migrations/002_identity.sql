-- =====================================================================
-- 002_identity.sql  —  Staff identity (ported from DailyCalendarShop
-- 002/015/026, trimmed to admin-only: no tenants, no customers, no OTP login)
-- =====================================================================
CREATE TABLE IF NOT EXISTS `Permissions` (
    `PermissionId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Code`         VARCHAR(100) NOT NULL,
    `Name`         VARCHAR(150) NOT NULL,
    `Module`       VARCHAR(50)  NULL,
    `CreatedAt`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`PermissionId`),
    UNIQUE KEY `uq_permissions_code` (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Roles` (
    `RoleId`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Name`           VARCHAR(100) NOT NULL,
    `NormalizedName` VARCHAR(100) NOT NULL,
    `Description`    VARCHAR(255) NULL,
    `IsSystem`       TINYINT(1)   NOT NULL DEFAULT 0,
    `CreatedAt`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt`      DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`RoleId`),
    UNIQUE KEY `uq_roles_name` (`NormalizedName`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Users` (
    `UserId`             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Email`              VARCHAR(256) NOT NULL,
    `NormalizedEmail`    VARCHAR(256) NOT NULL,
    `PasswordHash`       VARCHAR(255) NULL,
    `FullName`           VARCHAR(150) NULL,
    `PhoneNumber`        VARCHAR(20)  NULL,
    `IsActive`           TINYINT(1)   NOT NULL DEFAULT 1,
    `MustChangePassword` TINYINT(1)   NOT NULL DEFAULT 0,
    `AllowGoogleSignIn`  TINYINT(1)   NOT NULL DEFAULT 1,
    `LastLoginAt`        DATETIME     NULL,
    `FailedLoginCount`   INT          NOT NULL DEFAULT 0,
    `LockoutEndUtc`      DATETIME     NULL,
    `CreatedAt`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt`          DATETIME     NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`UserId`),
    UNIQUE KEY `uq_users_email` (`NormalizedEmail`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserRoles` (
    `UserId` BIGINT UNSIGNED NOT NULL,
    `RoleId` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`UserId`, `RoleId`),
    KEY `ix_userroles_role` (`RoleId`),
    CONSTRAINT `fk_userroles_user` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE,
    CONSTRAINT `fk_userroles_role` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`RoleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RolePermissions` (
    `RoleId`       BIGINT UNSIGNED NOT NULL,
    `PermissionId` BIGINT UNSIGNED NOT NULL,
    PRIMARY KEY (`RoleId`, `PermissionId`),
    KEY `ix_rolepermissions_permission` (`PermissionId`),
    CONSTRAINT `fk_rolepermissions_role` FOREIGN KEY (`RoleId`) REFERENCES `Roles` (`RoleId`) ON DELETE CASCADE,
    CONSTRAINT `fk_rolepermissions_permission` FOREIGN KEY (`PermissionId`) REFERENCES `Permissions` (`PermissionId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Google sign-in links. A user may sign in with Google only if an active Users row
-- with the same verified email exists and AllowGoogleSignIn = 1 (the "allowlist").
CREATE TABLE IF NOT EXISTS `UserExternalLogins` (
    `UserExternalLoginId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `UserId`              BIGINT UNSIGNED NOT NULL,
    `Provider`            VARCHAR(30)  NOT NULL,
    `ProviderUserId`      VARCHAR(255) NOT NULL,
    `Email`               VARCHAR(256) NULL,
    `CreatedAt`           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`UserExternalLoginId`),
    UNIQUE KEY `uq_userexternallogins_provider_key` (`Provider`, `ProviderUserId`),
    KEY `ix_userexternallogins_user` (`UserId`),
    CONSTRAINT `fk_userexternallogins_user` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RefreshTokens` (
    `RefreshTokenId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `UserId`         BIGINT UNSIGNED NOT NULL,
    `TokenHash`      VARCHAR(255) NOT NULL,
    `ExpiresAt`      DATETIME NOT NULL,
    `RevokedAt`      DATETIME NULL,
    `ReplacedByHash` VARCHAR(255) NULL,
    `CreatedByIp`    VARCHAR(45) NULL,
    `CreatedAt`      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`RefreshTokenId`),
    UNIQUE KEY `uq_refreshtokens_hash` (`TokenHash`),
    KEY `ix_refreshtokens_user` (`UserId`),
    CONSTRAINT `fk_refreshtokens_user` FOREIGN KEY (`UserId`) REFERENCES `Users` (`UserId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Password-reset codes (email). Used from Stage 6 once SMTP is wired.
CREATE TABLE IF NOT EXISTS `OtpVerifications` (
    `OtpVerificationId` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `Identifier`        VARCHAR(256) NOT NULL,
    `Purpose`           VARCHAR(30)  NOT NULL,
    `CodeHash`          VARCHAR(255) NOT NULL,
    `ExpiresAt`         DATETIME NOT NULL,
    `AttemptCount`      INT NOT NULL DEFAULT 0,
    `MaxAttempts`       INT NOT NULL DEFAULT 5,
    `ConsumedAt`        DATETIME NULL,
    `CreatedAt`         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`OtpVerificationId`),
    KEY `ix_otp_identifier_purpose` (`Identifier`, `Purpose`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `__schema_migrations` (`script_name`)
SELECT '002_identity.sql'
WHERE NOT EXISTS (SELECT 1 FROM `__schema_migrations` WHERE `script_name` = '002_identity.sql');
