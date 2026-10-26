CREATE TABLE IF NOT EXISTS templatePages (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  templateId BIGINT UNSIGNED NOT NULL,
  parentId BIGINT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  slug VARCHAR(150) NOT NULL,
  pageType VARCHAR(60) NOT NULL DEFAULT 'custom',
  content JSON NULL,
  parentKey BIGINT UNSIGNED GENERATED ALWAYS AS (IFNULL(parentId, 0)) STORED,
  UNIQUE KEY uqTplpageSlug (templateId, parentKey, slug),
  CONSTRAINT fkTplpageTemplate
    FOREIGN KEY (templateId) REFERENCES template(templateId) ON DELETE CASCADE,
  -- Parent deletion is handled by the controller because this table uses a stored generated key.
  CONSTRAINT fkTplpageParent
    FOREIGN KEY (parentId) REFERENCES templatePages(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS templateMenuItems (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  templateId BIGINT UNSIGNED NOT NULL,
  menuLocation ENUM('header', 'footer', 'sidebar') NOT NULL DEFAULT 'header',
  parentItemId BIGINT UNSIGNED NULL,
  templatePageId BIGINT UNSIGNED NULL,
  externalUrl VARCHAR(500) NULL,
  label VARCHAR(150) NULL,
  sortOrder INT NOT NULL DEFAULT 0,
  isVisible TINYINT(1) NOT NULL DEFAULT 1,
  INDEX idxTmenuOrder (templateId, menuLocation, parentItemId, sortOrder),
  UNIQUE KEY uqTmenuPage (templateId, menuLocation, templatePageId),
  CONSTRAINT fkTmenuTemplate
    FOREIGN KEY (templateId) REFERENCES template(templateId) ON DELETE CASCADE,
  CONSTRAINT fkTmenuParent
    FOREIGN KEY (parentItemId) REFERENCES templateMenuItems(id) ON DELETE CASCADE,
  CONSTRAINT fkTmenuPage
    FOREIGN KEY (templatePageId) REFERENCES templatePages(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS siteThemes (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  siteId BIGINT UNSIGNED NOT NULL,
  adminId BIGINT UNSIGNED NOT NULL,
  name VARCHAR(100) NOT NULL,
  settings JSON NOT NULL,
  type ENUM('default', 'dark', 'custom') NOT NULL DEFAULT 'default',
  isActive TINYINT(1) NOT NULL DEFAULT 0,
  activeSiteId BIGINT UNSIGNED GENERATED ALWAYS AS (
    IF(isActive = 1, siteId, NULL)
  ) STORED,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uqOneActiveTheme (activeSiteId),
  INDEX idxSthemesSite (siteId, isActive),
  -- Restrictive foreign keys avoid unsupported cascades on a table with a stored generated key.
  CONSTRAINT fkSthemesSite
    FOREIGN KEY (siteId) REFERENCES sites(id),
  CONSTRAINT fkSthemesAdmin
    FOREIGN KEY (adminId) REFERENCES admin(id)
) ENGINE=InnoDB;
