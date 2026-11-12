const db = require('../config/db').promise();
const { generateDbName } = require('../config/provisionSite');

/**
 * Migration script to convert old underscore-based database names
 * to new camelCase format without underscores
 */
async function migrateDatabaseNames() {
  try {
    console.log('Starting database name migration...\n');

    // Get all sites with old-style database names (containing underscores)
    const [sites] = await db.query(`
      SELECT s.id, s.dbName, s.name AS siteName, u.name AS userName
      FROM sites s
      JOIN users u ON u.userId = s.userId
      WHERE s.dbName IS NOT NULL
        AND s.dbName LIKE '%\\_%'
        
        AND s.provisionStatus = 'ready'
    `);

    if (sites.length === 0) {
      console.log('No sites found with old database name format. Migration complete!');
      process.exit(0);
    }

    console.log(`Found ${sites.length} site(s) to migrate:\n`);

    for (const site of sites) {
      console.log(`Processing Site ID: ${site.id}`);
      console.log(`  Old DB Name: ${site.dbName}`);

      // Generate new camelCase name
      const newDbName = generateDbName(site.userName, site.siteName);
      console.log(`  New DB Name: ${newDbName}`);

      try {
        // Check if old database exists
        const [[oldDb]] = await db.query(
          'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
          [site.dbName]
        );

        if (!oldDb) {
          console.log(`  ⚠️  Old database doesn't exist, skipping...`);
          continue;
        }

        // Check if new database already exists
        const [[newDb]] = await db.query(
          'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
          [newDbName]
        );

        if (newDb) {
          console.log(`  ⚠️  New database already exists, skipping...`);
          continue;
        }

        // Create new database
        await db.query(`CREATE DATABASE \`${newDbName}\`
          CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci`);
        console.log(`  ✓ Created new database`);

        // Get all tables from old database
        const [tables] = await db.query(
          'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
          [site.dbName]
        );

        console.log(`  Copying ${tables.length} table(s)...`);

        // Copy each table with data
        for (const table of tables) {
          const tableName = table.TABLE_NAME;

          // Create table structure
          await db.query(`CREATE TABLE \`${newDbName}\`.\`${tableName}\`
            LIKE \`${site.dbName}\`.\`${tableName}\``);

          // Copy data
          await db.query(`INSERT INTO \`${newDbName}\`.\`${tableName}\`
            SELECT * FROM \`${site.dbName}\`.\`${tableName}\``);

          console.log(`    ✓ Copied table: ${tableName}`);
        }

        // Update site record with new database name
        await db.query(
          'UPDATE sites SET dbName = ? WHERE id = ?',
          [newDbName, site.id]
        );
        console.log(`  ✓ Updated site record`);

        // Drop old database
        await db.query(`DROP DATABASE \`${site.dbName}\``);
        console.log(`  ✓ Removed old database`);

        console.log(`  ✅ Migration complete for Site ID: ${site.id}\n`);

      } catch (siteError) {
        console.error(`  ❌ Error migrating Site ID ${site.id}:`, siteError.message);
        console.log(`  Rolling back...`);

        // Attempt to drop new database if it was created
        try {
          await db.query(`DROP DATABASE IF EXISTS \`${newDbName}\``);
        } catch (rollbackError) {
          console.error(`  Failed to rollback:`, rollbackError.message);
        }
        console.log('');
      }
    }

    console.log('\n✅ Database name migration completed!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateDatabaseNames();
