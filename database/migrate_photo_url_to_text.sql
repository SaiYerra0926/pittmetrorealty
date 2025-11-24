-- Migration: Change photo_url from VARCHAR(500) to TEXT to support base64 images
-- This allows storing larger base64-encoded images in the database

-- Alter the property_photos table to change photo_url column type
ALTER TABLE property_photos 
ALTER COLUMN photo_url TYPE TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN property_photos.photo_url IS 'Stores base64-encoded image data or image URLs. Changed from VARCHAR(500) to TEXT to support larger images.';

