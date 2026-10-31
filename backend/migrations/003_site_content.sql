CREATE TABLE IF NOT EXISTS siteemployees (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  siteId        BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  email         VARCHAR(190) NULL,
  phone         VARCHAR(30) NULL,
  jobTitle      VARCHAR(120) NOT NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idxSiteEmployees (siteId, status, name),
  CONSTRAINT fkSiteEmployeeSite FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET @site_page_site_index_sql = IF(
  EXISTS (
    SELECT 1
      FROM information_schema.statistics
     WHERE table_schema = DATABASE()
       AND table_name = 'sitepages'
       AND index_name = 'uqSitePageSite'
  ),
  'SELECT 1',
  'ALTER TABLE sitepages ADD UNIQUE KEY uqSitePageSite (id, siteId)'
);
PREPARE site_page_site_index_stmt FROM @site_page_site_index_sql;
EXECUTE site_page_site_index_stmt;
DEALLOCATE PREPARE site_page_site_index_stmt;

CREATE TABLE IF NOT EXISTS siteentries (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  siteId        BIGINT UNSIGNED NOT NULL,
  sitePageId    BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(190) NOT NULL,
  description   TEXT NULL,
  price         DECIMAL(10,2) NULL,
  imageUrl      VARCHAR(1000) NULL,
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  customFields  JSON NULL,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idxSiteEntriesPage (siteId, sitePageId, status),
  CONSTRAINT fkSiteEntryPage FOREIGN KEY (sitePageId, siteId)
    REFERENCES sitepages(id, siteId) ON DELETE CASCADE
) ENGINE=InnoDB;
