/**
 * Migrate existing sites from centralized tables to per-site databases
 * Run this once to provision databases for sites created before the new system
 */

const db = require('../config/db');
const { provisionSiteDatabase, tn } = require('../config/provisionSite');

const q = (sql, params = []) =>
  new Promise((res, rej) => db.query(sql, params, (e, r) => (e ? rej(e) : res(r))));

async function migrateSite(siteId) {
  console.log(`\n=== Migrating Site ${siteId} ===`);

  try {
    // Check if already provisioned
    const site = await q('SELECT id, name, dbName, provisionStatus FROM sites WHERE id = ?', [siteId]);
    if (!site || site.length === 0) {
      console.log(`❌ Site ${siteId} not found`);
      return false;
    }

    const s = site[0];
    if (s.provisionStatus === 'ready' && s.dbName) {
      console.log(`✓ Site ${siteId} already provisioned: ${s.dbName}`);
      return true;
    }

    console.log(`Site: ${s.name}`);

    // Provision the database (creates DB, tables, seeds pages from paymentpages)
    await provisionSiteDatabase(siteId);
    console.log('✓ Database and tables created');

    // Get the generated dbName
    const updated = await q('SELECT dbName FROM sites WHERE id = ?', [siteId]);
    const dbName = updated[0].dbName;
    console.log(`✓ Database name: ${dbName}`);

    // Migrate data from old centralized tables
    await migrateData(siteId, dbName);

    console.log(`✅ Site ${siteId} migration complete`);
    return true;

  } catch (error) {
    console.error(`❌ Migration failed for site ${siteId}:`, error.message);
    return false;
  }
}

async function migrateData(siteId, dbName) {
  console.log('Migrating data from old tables...');
  const table = (name) => tn(siteId, name, dbName);

  // Migrate headers (siteheaders → headers)
  try {
    const [existing] = await q(`SELECT COUNT(*) as count FROM ${table('headers')}`);
    if (existing[0].count === 0) {
      const result = await q(`
        INSERT INTO ${table('headers')}
          (logoUrl, siteTitle, footerText, footerAddress, footerPhone,
           footerEmail, copyrightText, socialLinks, createdAt, updatedAt)
        SELECT logoUrl, siteTitle, footerText, footerAddress, footerPhone,
               footerEmail, copyrightText, socialLinks, createdAt, updatedAt
        FROM siteheaders
        WHERE siteId = ?
      `, [siteId]);
      console.log(`  ✓ Headers: ${result.affectedRows} rows migrated`);
    } else {
      console.log(`  ✓ Headers: already seeded (${existing[0].count} rows)`);
    }
  } catch (err) {
    console.log(`  ⚠ Headers: ${err.message}`);
  }

  // Migrate news (sitenews → news)
  try {
    const result = await q(`
      INSERT IGNORE INTO ${table('news')}
        (title, imageUrl, content, status, publishedAt, createdAt, updatedAt)
      SELECT title, imageUrl, content, status, publishedAt, createdAt, updatedAt
      FROM sitenews
      WHERE siteId = ?
    `, [siteId]);
    console.log(`  ✓ News: ${result.affectedRows} rows migrated`);
  } catch (err) {
    console.log(`  ⚠ News: ${err.message}`);
  }

  // Migrate galleries (sitegalleries → galleries)
  try {
    const result = await q(`
      INSERT IGNORE INTO ${table('galleries')}
        (title, imageUrl, caption, altText, sortOrder, status, createdAt, updatedAt)
      SELECT title, imageUrl, caption, altText, sortOrder, status, createdAt, updatedAt
      FROM sitegalleries
      WHERE siteId = ?
    `, [siteId]);
    console.log(`  ✓ Galleries: ${result.affectedRows} rows migrated`);
  } catch (err) {
    console.log(`  ⚠ Galleries: ${err.message}`);
  }

  // Migrate slider (siteslider → slider)
  try {
    const result = await q(`
      INSERT IGNORE INTO ${table('slider')}
        (title, imageUrl, sortOrder, status, createdAt, updatedAt)
      SELECT title, imageUrl, sortOrder, status, createdAt, updatedAt
      FROM siteslider
      WHERE siteId = ?
    `, [siteId]);
    console.log(`  ✓ Slider: ${result.affectedRows} rows migrated`);
  } catch (err) {
    console.log(`  ⚠ Slider: ${err.message}`);
  }

  // Migrate employees (siteemployees → employees)
  try {
    const result = await q(`
      INSERT IGNORE INTO ${table('employees')}
        (name, email, phone, jobTitle, status, createdAt, updatedAt)
      SELECT name, email, phone, jobTitle, status, createdAt, updatedAt
      FROM siteemployees
      WHERE siteId = ?
    `, [siteId]);
    console.log(`  ✓ Employees: ${result.affectedRows} rows migrated`);
  } catch (err) {
    console.log(`  ⚠ Employees: ${err.message}`);
  }

  // Note: pages are already seeded by provisionSiteDatabase from paymentpages
  console.log('  ✓ Pages: already seeded from paymentpages');
}

async function main() {
  console.log('='.repeat(60));
  console.log('MIGRATING EXISTING SITES TO PER-SITE DATABASES');
  console.log('='.repeat(60));

  // Find sites that need migration (not provisioned yet)
  const sites = await q(`
    SELECT id, name, provisionStatus
    FROM sites
    WHERE provisionStatus != 'ready' OR dbName IS NULL
    ORDER BY id
  `);

  if (!sites || sites.length === 0) {
    console.log('\n✅ All sites are already provisioned!');
    db.end();
    return;
  }

  console.log(`\nFound ${sites.length} site(s) to migrate:`);
  sites.forEach(s => console.log(`  - Site ${s.id}: ${s.name} (${s.provisionStatus})`));

  let success = 0;
  let failed = 0;

  for (const site of sites) {
    const result = await migrateSite(site.id);
    if (result) success++;
    else failed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Successfully migrated: ${success}`);
  if (failed > 0) console.log(`❌ Failed: ${failed}`);
  console.log('');

  db.end();
}

main().catch(err => {
  console.error('Fatal error:', err);
  db.end();
  process.exit(1);
});
