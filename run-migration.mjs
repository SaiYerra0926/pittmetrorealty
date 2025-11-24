import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration - matches your database setup
const dbConfig = {
  host: process.env.DATABASE_HOST || 'pittmetropg.c1sg4s884u9n.us-east-2.rds.amazonaws.com',
  port: Number(process.env.DATABASE_PORT) || 5432,
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres123',
  database: process.env.DATABASE_NAME || 'postgres',
  ssl: {
    rejectUnauthorized: false,
  },
};

const pool = new Pool(dbConfig);

async function runMigration() {
  let client;
  
  try {
    console.log('🔄 Running Database Migration: photo_url VARCHAR(500) → TEXT');
    console.log('===========================================================');
    console.log('📊 Database Configuration:');
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Port: ${dbConfig.port}`);
    console.log(`   Database: ${dbConfig.database}`);
    console.log(`   User: ${dbConfig.user}`);
    console.log('');
    
    console.log('🔌 Connecting to PostgreSQL database...');
    client = await pool.connect();
    
    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Connected successfully at:', result.rows[0].now);
    console.log('');
    
    // Check current column type
    console.log('🔍 Checking current column type...');
    const columnInfo = await client.query(`
      SELECT data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'property_photos' 
      AND column_name = 'photo_url'
    `);
    
    if (columnInfo.rows.length === 0) {
      console.error('❌ Error: property_photos table or photo_url column not found!');
      console.log('   Please ensure the database schema is set up correctly.');
      process.exit(1);
    }
    
    const currentType = columnInfo.rows[0].data_type;
    const currentLength = columnInfo.rows[0].character_maximum_length;
    
    console.log(`   Current type: ${currentType}${currentLength ? `(${currentLength})` : ''}`);
    console.log('');
    
    if (currentType === 'text' || (currentType === 'character varying' && !currentLength)) {
      console.log('✅ Migration already applied! Column is already TEXT type.');
      console.log('   No changes needed.');
      process.exit(0);
    }
    
    // Run migration
    console.log('🔄 Running migration: ALTER TABLE property_photos ALTER COLUMN photo_url TYPE TEXT...');
    await client.query('ALTER TABLE property_photos ALTER COLUMN photo_url TYPE TEXT');
    console.log('✅ Migration completed successfully!');
    console.log('');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const verifyInfo = await client.query(`
      SELECT data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_name = 'property_photos' 
      AND column_name = 'photo_url'
    `);
    
    const newType = verifyInfo.rows[0].data_type;
    console.log(`   New type: ${newType}`);
    console.log('');
    
    if (newType === 'text') {
      console.log('✅ Migration verified successfully!');
      console.log('   The photo_url column is now TEXT and can store large base64 images.');
    } else {
      console.error('❌ Migration verification failed!');
      console.error(`   Expected: text, Got: ${newType}`);
      process.exit(1);
    }
    
    // Add comment
    try {
      await client.query(`
        COMMENT ON COLUMN property_photos.photo_url IS 
        'Stores base64-encoded image data or image URLs. Changed from VARCHAR(500) to TEXT to support larger images.'
      `);
      console.log('✅ Column comment added.');
    } catch (commentError) {
      console.warn('⚠️  Could not add column comment (non-critical):', commentError.message);
    }
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('   You can now upload photos up to 5MB in size.');
    console.log('   Please restart your server to apply the changes.');
    
  } catch (error) {
    console.error('');
    console.error('❌ Migration failed!');
    console.error('Error:', error.message);
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

runMigration();

