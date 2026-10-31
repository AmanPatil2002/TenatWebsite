

CREATE DATABASE IF NOT EXISTS tenant
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE tenant;

CREATE TABLE users (
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
CREATE TABLE review (
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
CREATE TABLE categories (
  categoryId  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(190) NOT NULL,
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
CREATE TABLE theme (
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
CREATE TABLE pages (
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
CREATE TABLE template (
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
--    isDefault = 1 -> included in template price
--    isDefault = 0 -> ADDITIONAL, client may add it by paying pages.pagePrice
-- ---------------------------------------------------------------------
CREATE TABLE templatepages (
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
CREATE TABLE templatetheme (
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
--    FK (templateId, themeId) guarantees the theme belongs to the template.
--    UNIQUE (id, templateId) lets paymentpages reference both together.
-- ---------------------------------------------------------------------
CREATE TABLE payments (
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
--     FK (templateId, pagesId) guarantees each page belongs to the template.
--     price is a snapshot: 0 for default pages, pagePrice for additional.
-- ---------------------------------------------------------------------
CREATE TABLE paymentpages (
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
CREATE TABLE invoices (
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
CREATE TABLE sites (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  userId        BIGINT UNSIGNED NOT NULL,
  templateId    BIGINT UNSIGNED NOT NULL,
  themeId       BIGINT UNSIGNED NOT NULL,             -- copied from payments.themeId
  paymentId     BIGINT UNSIGNED NOT NULL,
  name          VARCHAR(150) NOT NULL,
  status        ENUM('active','expired','suspended') NOT NULL DEFAULT 'active',
  startsAt      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expiresAt     DATETIME NOT NULL,
  createdAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chkSiteDates CHECK (expiresAt > startsAt),
  UNIQUE KEY uqSitePayment (paymentId),
  INDEX idxSitesUserStatus (userId, status),
  INDEX idxSitesExpiry (status, expiresAt),
  INDEX idxSitesTemplate (templateId),
  CONSTRAINT fkSiteUser     FOREIGN KEY (userId)     REFERENCES users(userId),
  CONSTRAINT fkSiteTemplate FOREIGN KEY (templateId) REFERENCES template(templateId),
  CONSTRAINT fkSiteTheme    FOREIGN KEY (themeId)    REFERENCES theme(themeId),
  CONSTRAINT fkSitePayment  FOREIGN KEY (paymentId)  REFERENCES payments(id)
) ENGINE=InnoDB;

-- A separate page-manager login is granted by the platform admin per site.
-- These credentials never provide access to purchased theme settings.
CREATE TABLE `admin` (
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
-- 13. site_pages : editable, site-specific copies of purchased pages.
--     Custom pages have no sourcePagesId and never modify the shared library.
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

CREATE TABLE siteemployees (
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

CREATE TABLE siteentries (
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

INSERT IGNORE INTO sitepages (siteId, sourcePagesId, title, page, sortOrder)
SELECT s.id, p.pagesId, p.title, p.page, tp.sortOrder
  FROM sites s
  JOIN payments pay ON pay.id = s.paymentId AND pay.status = 'captured'
  JOIN paymentpages pp ON pp.paymentId = pay.id
  JOIN pages p ON p.pagesId = pp.pagesId
  JOIN templatepages tp ON tp.templateId = pp.templateId AND tp.pagesId = pp.pagesId;

-- ---------------------------------------------------------------------
-- 14. faq  (admin CRUD)
-- ---------------------------------------------------------------------
CREATE TABLE faq (
  faqId      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question   VARCHAR(500) NOT NULL,
  answer     TEXT NOT NULL,
  createdAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uqFaqQuestion (question)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 15. acontact  (admin CRUD)
-- ---------------------------------------------------------------------
CREATE TABLE acontact (
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

-- =====================================================================
-- VIEWS
-- =====================================================================

-- Public / pre-purchase: template + available themes + page NAMES ONLY.
-- Page content (`page`) is deliberately NOT exposed here.
-- Filter with WHERE status = 'published' for clients.
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

-- Post-purchase: the ONLY place a client reads page content.
-- Always query with  WHERE userId = <JWT user> AND siteId = ?
-- Returns rows only for an active, unexpired site whose payment is captured,
-- with the single theme chosen at purchase.
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
