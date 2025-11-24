import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
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
    console.log('🔄 Running Database Migration: Add latitude/longitude columns');
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
    
    // Check if columns already exist
    console.log('🔍 Checking if latitude/longitude columns exist...');
    const columnInfo = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'properties' 
      AND column_name IN ('latitude', 'longitude')
    `);
    
    const existingColumns = columnInfo.rows.map(r => r.column_name);
    console.log(`   Existing columns: ${existingColumns.length > 0 ? existingColumns.join(', ') : 'none'}`);
    console.log('');
    
    // Add latitude column if it doesn't exist
    if (!existingColumns.includes('latitude')) {
      console.log('🔄 Adding latitude column...');
      await client.query(`
        ALTER TABLE properties 
        ADD COLUMN latitude DECIMAL(10, 8)
      `);
      console.log('✅ Latitude column added');
    } else {
      console.log('✅ Latitude column already exists');
    }
    
    // Add longitude column if it doesn't exist
    if (!existingColumns.includes('longitude')) {
      console.log('🔄 Adding longitude column...');
      await client.query(`
        ALTER TABLE properties 
        ADD COLUMN longitude DECIMAL(11, 8)
      `);
      console.log('✅ Longitude column added');
    } else {
      console.log('✅ Longitude column already exists');
    }
    
    // Add indexes
    console.log('🔄 Creating indexes...');
    try {
      await client.query('CREATE INDEX IF NOT EXISTS idx_properties_latitude ON properties(latitude)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_properties_longitude ON properties(longitude)');
      await client.query('CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude)');
      console.log('✅ Indexes created');
    } catch (indexError) {
      console.warn('⚠️  Could not create indexes (may already exist):', indexError.message);
    }
    
    // Add comments
    try {
      await client.query(`
        COMMENT ON COLUMN properties.latitude IS 
        'Latitude coordinate for map display (geocoded from address)'
      `);
      await client.query(`
        COMMENT ON COLUMN properties.longitude IS 
        'Longitude coordinate for map display (geocoded from address)'
      `);
      console.log('✅ Column comments added');
    } catch (commentError) {
      console.warn('⚠️  Could not add column comments (non-critical):', commentError.message);
    }
    
    console.log('');
    console.log('🎉 Migration completed successfully!');
    console.log('   Properties can now store latitude and longitude coordinates.');
    console.log('   Coordinates will be saved when properties are created/updated.');
    
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

