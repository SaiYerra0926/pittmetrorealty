-- Migration: Add latitude and longitude columns to properties table
-- This allows storing geocoded coordinates for map display

-- Add latitude column (DECIMAL for precision)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column (DECIMAL for precision)
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for faster location-based queries
CREATE INDEX IF NOT EXISTS idx_properties_latitude ON properties(latitude);
CREATE INDEX IF NOT EXISTS idx_properties_longitude ON properties(longitude);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude);

-- Add comment to document the columns
COMMENT ON COLUMN properties.latitude IS 'Latitude coordinate for map display (geocoded from address)';
COMMENT ON COLUMN properties.longitude IS 'Longitude coordinate for map display (geocoded from address)';

