
CREATE DATABASE IF NOT EXISTS tenant
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE tenant;

-- ---------------------------------------------------------------------
-- 1. users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  userId        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120) NOT NULL,
  email         VARCHAR(190) NOT NULL,
  phone         VARCHAR(20)  NULL,
  passwordHash  VARCHAR(255) NOT NULL,
  address       TEXT NULL,
  role          ENUM('admin','client') NOT NULL DEFAULT 'client',
  status        ENUM('active','inactive') NOT NULL DEFAULT 'active',
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uqUsersEmail (email),
  INDEX idxUsersRoleStatus (role, status)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2. review
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS review (
  reviewId     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reviewBy     BIGINT UNSIGNED NOT NULL,
  description  TEXT NOT NULL,
  rating       TINYINT UNSIGNED NOT NULL,
  createdAt    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chkReviewRating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fkReviewUser FOREIGN KEY (reviewBy) REFERENCES users(userId),
  INDEX idxReviewUser (reviewBy)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3. categories
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  categoryId  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(190) NOT NULL,
  packKey     VARCHAR(30) NULL,
  tag         VARCHAR(500) NULL,
  content     JSON NULL,
  createdBy   BIGINT UNSIGNED NOT NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uqCategoryName (name),
  CONSTRAINT fkCategoryCreator FOREIGN KEY (createdBy) REFERENCES users(userId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4. theme  (admin-managed library)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS theme (
  themeId     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(190) NOT NULL,
  color       VARCHAR(100) NOT NULL,
  background  VARCHAR(100) NOT NULL,
  createdBy   BIGINT UNSIGNED NOT NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uqThemeName (name),
  CONSTRAINT fkThemeCreator FOREIGN KEY (createdBy) REFERENCES users(userId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5. pages  (admin-managed library; `page` content is only readable by
--            clients who bought it, see sitepagesview)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pages (
  pagesId     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  categoryId  BIGINT UNSIGNED NOT NULL,
  page        TEXT NOT NULL,
  pagePrice   DECIMAL(10,2) NOT NULL DEFAULT 0.00,   -- charged when added as an ADDITIONAL page
  createdBy   BIGINT UNSIGNED NOT NULL,
  createdAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chkPagePrice CHECK (pagePrice >= 0),
  UNIQUE KEY uqPageCategoryTitle (categoryId, title),
  CONSTRAINT fkPagesCategory FOREIGN KEY (categoryId) REFERENCES categories(categoryId),
  CONSTRAINT fkPagesCreator  FOREIGN KEY (createdBy)  REFERENCES users(userId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 6. template
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS template (
  templateId        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  categoryId        BIGINT UNSIGNED NOT NULL,
  name              VARCHAR(150) NOT NULL,
  language          TEXT NULL,
  shortDescription  VARCHAR(300) NULL,
  description       TEXT NULL,
  thumbnailUrl      VARCHAR(500) NULL,
  photos            TEXT NULL,
  price             DECIMAL(10,2) NOT NULL,           -- covers the DEFAULT pages
  currency          CHAR(3) NOT NULL DEFAULT 'INR',
  validityDays      INT UNSIGNED NOT NULL DEFAULT 365,
  status            ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  createdBy         BIGINT UNSIGNED NOT NULL,
  createdAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chkTemplatePrice    CHECK (price > 0),
  CONSTRAINT chkTemplateValidity CHECK (validityDays > 0),
  INDEX idxTplCategoryStatus (categoryId, status),
  CONSTRAINT fkTplCategory FOREIGN KEY (categoryId) REFERENCES categories(categoryId),
  CONSTRAINT fkTplCreator  FOREIGN KEY (createdBy)  REFERENCES users(userId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 7. templatepages : pages offered by a template
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS templatepages (
  templateId  BIGINT UNSIGNED NOT NULL,
  pagesId     BIGINT UNSIGNED NOT NULL,
  isDefault   TINYINT(1) NOT NULL DEFAULT 1,
  sortOrder   INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (templateId, pagesId),
  INDEX idxTplPagesOrder (templateId, sortOrder),
  CONSTRAINT fkTpTemplate FOREIGN KEY (templateId) REFERENCES template(templateId) ON DELETE CASCADE,
  CONSTRAINT fkTpPages    FOREIGN KEY (pagesId)    REFERENCES pages(pagesId)
);

-- ---------------------------------------------------------------------
-- 8. templatetheme : themes a client may choose from (exactly ONE default)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS templatetheme (
  templateId  BIGINT UNSIGNED NOT NULL,
  themeId     BIGINT UNSIGNED NOT NULL,
  isDefault   TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (templateId, themeId),
  INDEX idxTtTheme (themeId),
  CONSTRAINT fkTtTemplate FOREIGN KEY (templateId) REFERENCES template(templateId) ON DELETE CASCADE,
  CONSTRAINT fkTtTheme    FOREIGN KEY (themeId)    REFERENCES theme(themeId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 9. payments : the client's order. Stores the ONE chosen theme.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  transactionId  VARCHAR(64) NOT NULL,               -- Razorpay order id
  userId         BIGINT UNSIGNED NOT NULL,
  templateId     BIGINT UNSIGNED NOT NULL,
  themeId        BIGINT UNSIGNED NOT NULL,
  amount         DECIMAL(10,2) NOT NULL,              -- template price + additional pages
  currency       CHAR(3) NOT NULL DEFAULT 'INR',
  method         VARCHAR(30) NULL,
  status         ENUM('created','authorized','captured','failed','refunded') NOT NULL DEFAULT 'created',
  paidAt         DATETIME NULL,
  createdAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chkPayAmount CHECK (amount > 0),
  UNIQUE KEY uqPayTransaction (transactionId),
  UNIQUE KEY uqPayIdTemplate (id, templateId),
  INDEX idxPayUserStatus (userId, status),
  INDEX idxPayTemplate (templateId),
  CONSTRAINT fkPayUser          FOREIGN KEY (userId)     REFERENCES users(userId),
  CONSTRAINT fkPayTemplate      FOREIGN KEY (templateId) REFERENCES template(templateId),
  CONSTRAINT fkPayTemplateTheme FOREIGN KEY (templateId, themeId)
                                REFERENCES templatetheme(templateId, themeId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 10. paymentpages : pages in the order (default + chosen additional).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS paymentpages (
  paymentId   BIGINT UNSIGNED NOT NULL,
  pagesId     BIGINT UNSIGNED NOT NULL,
  templateId  BIGINT UNSIGNED NOT NULL,
  isDefault   TINYINT(1) NOT NULL,
  price       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (paymentId, pagesId),
  CONSTRAINT chkPpPrice CHECK (price >= 0),
  CONSTRAINT fkPpPayment      FOREIGN KEY (paymentId, templateId)
                              REFERENCES payments(id, templateId) ON DELETE CASCADE,
  CONSTRAINT fkPpTemplatePage FOREIGN KEY (templateId, pagesId)
                              REFERENCES templatepages(templateId, pagesId)
);

-- ---------------------------------------------------------------------
-- 11. invoices
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS invoices (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  invoiceNumber  VARCHAR(30) NOT NULL,
  paymentId      BIGINT UNSIGNED NOT NULL,
  userId         BIGINT UNSIGNED NOT NULL,
  billingName    VARCHAR(150) NOT NULL,
  totalAmount    DECIMAL(10,2) NOT NULL,
  issuedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uqInvNumber (invoiceNumber),
  UNIQUE KEY uqInvPayment (paymentId),
  INDEX idxInvUser (userId),
  CONSTRAINT fkInvPayment FOREIGN KEY (paymentId) REFERENCES payments(id),
  CONSTRAINT fkInvUser    FOREIGN KEY (userId)    REFERENCES users(userId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 12. sites : created when a payment is captured (one purchase = one site)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sites (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId        BIGINT UNSIGNED NOT NULL,
  templateId    BIGINT UNSIGNED NOT NULL,
  themeId       BIGINT UNSIGNED NOT NULL,             -- copied from payments.themeId
  paymentId     BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  dbName        VARCHAR(64) NULL,
  status        ENUM('active','expired','suspended') NOT NULL DEFAULT 'active',
  provisionStatus ENUM('pending','ready','failed') NOT NULL DEFAULT 'pending',
  provisionError  VARCHAR(500) NULL,
  startsAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt     DATETIME NOT NULL,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chkSiteDates CHECK (expiresAt > startsAt),
  UNIQUE KEY uqSitePayment (paymentId),
  UNIQUE KEY uqSitesDbName (dbName),
  INDEX idxSitesUserStatus (userId, status),
  INDEX idxSitesExpiry (status, expiresAt),
  INDEX idxSitesTemplate (templateId),
  CONSTRAINT fkSiteUser     FOREIGN KEY (userId)     REFERENCES users(userId),
  CONSTRAINT fkSiteTemplate FOREIGN KEY (templateId) REFERENCES template(templateId),
  CONSTRAINT fkSiteTheme    FOREIGN KEY (themeId)    REFERENCES theme(themeId),
  CONSTRAINT fkSitePayment  FOREIGN KEY (paymentId)  REFERENCES payments(id)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 13. sitepages : editable, site-specific copies of purchased pages.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sitepages (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  siteId        BIGINT UNSIGNED NOT NULL,
  sourcePagesId BIGINT UNSIGNED NULL,
  title         VARCHAR(150) NOT NULL,
  page          TEXT NOT NULL,
  sortOrder     INT UNSIGNED NOT NULL DEFAULT 0,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uqSiteSourcePage (siteId, sourcePagesId),
  UNIQUE KEY uqSitePageSite (id, siteId),
  INDEX idxSitePagesOrder (siteId, sortOrder, id),
  CONSTRAINT fkSitePagesSite FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE,
  CONSTRAINT fkSitePagesSource FOREIGN KEY (sourcePagesId) REFERENCES pages(pagesId) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 14. faq
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS faq (
  faqId      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question   VARCHAR(500) NOT NULL,
  answer     TEXT NOT NULL,
  createdAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uqFaqQuestion (question)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. acontact
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS acontact (
  contactId  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  contact    CHAR(10)     NOT NULL,
  email      VARCHAR(190) NOT NULL,
  address    VARCHAR(100) NOT NULL,
  createdBy  BIGINT UNSIGNED NOT NULL,
  createdAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chkAcontactPhone CHECK (contact REGEXP '^[0-9]{10}$'),
  INDEX idxAcontactCreatedAt (createdAt),
  CONSTRAINT fkAcontactCreator FOREIGN KEY (createdBy) REFERENCES users(userId)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 16. passwordResets
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passwordResets (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId    BIGINT UNSIGNED NOT NULL,
  codeHash  VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  attempts  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  usedAt    DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idxPasswordResetsUserCreated (userId, createdAt),
  CONSTRAINT fkPasswordResetsUser FOREIGN KEY (userId)
    REFERENCES users(userId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 17. admin
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `admin` (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  siteId        BIGINT UNSIGNED NOT NULL,
  userId        BIGINT UNSIGNED NOT NULL,
  email         VARCHAR(190) NOT NULL,
  passwordHash  VARCHAR(255) NOT NULL,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uqSiteAdminSite (siteId),
  INDEX idxSiteAdminUser (userId),
  CONSTRAINT fkSiteAdminSite FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE,
  CONSTRAINT fkSiteAdminUser FOREIGN KEY (userId) REFERENCES users(userId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 18. sitetables
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sitetables (
  id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  siteId    BIGINT UNSIGNED NOT NULL,
  baseName  VARCHAR(40) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uqSiteBase (siteId, baseName),
  CONSTRAINT fkSiteTablesSite FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 19. bugreports
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bugreports (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reportedBy      BIGINT UNSIGNED NOT NULL,
  siteId          BIGINT UNSIGNED NULL,
  title           VARCHAR(190) NOT NULL,
  description     TEXT NOT NULL,
  screenshotUrl   VARCHAR(500) NULL,
  type            ENUM('bug','error','suggestion','other') NOT NULL DEFAULT 'bug',
  severity        ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  status          ENUM('open','in_progress','resolved','closed','rejected') NOT NULL DEFAULT 'open',
  adminNote       TEXT NULL,
  resolvedBy      BIGINT UNSIGNED NULL,
  resolvedAt      DATETIME NULL,
  createdAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idxBugUser (reportedBy, createdAt),
  INDEX idxBugStatus (status, severity, createdAt),
  INDEX idxBugSite (siteId),
  CONSTRAINT fkBugReporter FOREIGN KEY (reportedBy) REFERENCES users(userId),
  CONSTRAINT fkBugSite     FOREIGN KEY (siteId)     REFERENCES sites(id) ON DELETE SET NULL,
  CONSTRAINT fkBugResolver FOREIGN KEY (resolvedBy) REFERENCES users(userId) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 20. sitethemes : per-site theme customization
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sitethemes (
    siteId BIGINT UNSIGNED NOT NULL PRIMARY KEY,
    defaultThemeId BIGINT UNSIGNED NOT NULL,
    defaultTheme JSON NOT NULL,
    customTheme JSON NULL,
    activeTheme ENUM('default', 'custom') NOT NULL DEFAULT 'default',
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fkSiteThemesSite FOREIGN KEY (siteId) REFERENCES sites(id) ON DELETE CASCADE,
    CONSTRAINT fkSiteThemesDefault FOREIGN KEY (defaultThemeId) REFERENCES theme(themeId)
) ENGINE=InnoDB;

-- =====================================================================
-- VIEWS
-- =====================================================================

CREATE OR REPLACE VIEW templatefull AS
SELECT
  t.*,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
             'themeId',    th.themeId,
             'name',       th.name,
             'color',      th.color,
             'background', th.background,
             'isDefault',  tt.isDefault))
    FROM templatetheme tt
    JOIN theme th ON th.themeId = tt.themeId
    WHERE tt.templateId = t.templateId
  ) AS themes,
  (
    SELECT JSON_ARRAYAGG(JSON_OBJECT(
             'pagesId',   p.pagesId,
             'title',     p.title,
             'isDefault', tp.isDefault,
             'pagePrice', IF(tp.isDefault = 1, 0, p.pagePrice),
             'sortOrder', tp.sortOrder))
    FROM templatepages tp
    JOIN pages p ON p.pagesId = tp.pagesId
    WHERE tp.templateId = t.templateId
  ) AS pages
FROM template t;

CREATE OR REPLACE VIEW sitepagesview AS
SELECT
  s.id          AS siteId,
  s.userId,
  s.name        AS siteName,
  s.templateId,
  s.expiresAt,
  th.themeId,
  th.name       AS themeName,
  th.color,
  th.background,
  p.pagesId,
  p.title,
  p.page,
  pp.isDefault,
  tp.sortOrder
FROM sites s
JOIN payments      pay ON pay.id = s.paymentId AND pay.status = 'captured'
JOIN paymentpages  pp  ON pp.paymentId = pay.id
JOIN pages         p   ON p.pagesId = pp.pagesId
JOIN templatepages tp  ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId
JOIN theme         th  ON th.themeId = s.themeId
WHERE s.status = 'active' AND s.expiresAt > NOW();

-- =====================================================================
-- SEED DATA
-- =====================================================================
INSERT IGNORE INTO sitepages (siteId, sourcePagesId, title, page, sortOrder)
SELECT s.id, p.pagesId, p.title, p.page, tp.sortOrder
  FROM sites s
  JOIN payments pay ON pay.id = s.paymentId AND pay.status = 'captured'
  JOIN paymentpages pp ON pp.paymentId = pay.id
  JOIN pages p ON p.pagesId = pp.pagesId
  JOIN templatepages tp ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId;
