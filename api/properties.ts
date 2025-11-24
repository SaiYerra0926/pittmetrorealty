import { Pool } from 'pg';
import pool from '../src/lib/database.js';

// Get all properties
export const getProperties = async (req, res) => {
  try {
    const { type, status, minPrice, maxPrice, bedrooms, bathrooms, city } = req.query;
    
    let query = `
      SELECT 
        p.*,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.phone as owner_phone,
        u.email as owner_email,
        a.first_name as agent_first_name,
        a.last_name as agent_last_name,
        a.phone as agent_phone,
        a.email as agent_email
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN users a ON p.agent_id = a.id
      WHERE p.listing_type IN ('rent', 'sell', 'buy')
        AND p.status IN ('active', 'inactive')
    `;
    
    const params: any[] = [];
    let paramCount = 1;
    
    if (type) {
      query += ` AND p.property_type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (status) {
      query += ` AND p.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (minPrice) {
      query += ` AND p.price >= $${paramCount}`;
      params.push(parseFloat(minPrice as string));
      paramCount++;
    }
    
    if (maxPrice) {
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice as string));
      paramCount++;
    }
    
    if (bedrooms) {
      query += ` AND p.bedrooms >= $${paramCount}`;
      params.push(parseInt(bedrooms as string));
      paramCount++;
    }
    
    if (bathrooms) {
      query += ` AND p.bathrooms >= $${paramCount}`;
      params.push(parseFloat(bathrooms as string));
      paramCount++;
    }
    
    if (city) {
      query += ` AND p.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    const result = await pool.query(query, params);
    
    // Get photos for each property
    const propertiesWithPhotos = await Promise.all(
      result.rows.map(async (property) => {
        const photosResult = await pool.query(
          'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order',
          [property.id]
        );
        
        const featuresResult = await pool.query(
          'SELECT feature_name FROM property_features WHERE property_id = $1',
          [property.id]
        );
        
        const amenitiesResult = await pool.query(
          'SELECT amenity_name FROM property_amenities WHERE property_id = $1',
          [property.id]
        );
        
        // Map database fields to frontend format
        const mappedProperty = {
          ...property,
          zipCode: property.zip_code || property.zipCode || '',
          propertyType: property.property_type || property.propertyType || '',
          squareFeet: property.square_feet || property.squareFeet || 0,
          yearBuilt: property.year_built || property.yearBuilt,
          lotSize: property.lot_size || property.lotSize || 0,
          listingType: property.listing_type || property.listingType || 'rent',
          availableDate: property.available_date || property.availableDate,
          submittedAt: property.created_at || property.createdAt,
          createdAt: property.created_at || property.createdAt,
          updatedAt: property.updated_at || property.updatedAt,
          photos: photosResult.rows.map(p => ({
            id: p.id,
            name: p.photo_name || p.name || '',
            url: p.photo_url || p.url || '',
            size: p.photo_size || p.size || 0
          })),
          features: featuresResult.rows.map(f => f.feature_name).filter(Boolean),
          amenities: amenitiesResult.rows.map(a => a.amenity_name).filter(Boolean),
          ownerName: property.owner_name || (property.owner_first_name ? `${property.owner_first_name} ${property.owner_last_name || ''}`.trim() : '') || '',
          ownerEmail: property.owner_email || property.ownerEmail || '',
          ownerPhone: property.owner_phone || property.ownerPhone || ''
        };
        
        return mappedProperty;
      })
    );
    
    res.json({
      success: true,
      listings: propertiesWithPhotos,
      total: propertiesWithPhotos.length
    });
    
  } catch (error) {
    console.error('Error fetching properties:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get single property by ID
export const getPropertyById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const propertyResult = await pool.query(
      `SELECT 
        p.*,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.phone as owner_phone,
        u.email as owner_email,
        a.first_name as agent_first_name,
        a.last_name as agent_last_name,
        a.phone as agent_phone,
        a.email as agent_email
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      LEFT JOIN users a ON p.agent_id = a.id
      WHERE p.id = $1`,
      [id]
    );
    
    if (propertyResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }
    
    const property = propertyResult.rows[0];
    
    // Get photos
    const photosResult = await pool.query(
      'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order',
      [id]
    );
    
    // Get features
    const featuresResult = await pool.query(
      'SELECT feature_name FROM property_features WHERE property_id = $1',
      [id]
    );
    
    // Get amenities
    const amenitiesResult = await pool.query(
      'SELECT amenity_name FROM property_amenities WHERE property_id = $1',
      [id]
    );
    
    // Get reviews
    const reviewsResult = await pool.query(
      'SELECT * FROM reviews WHERE property_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    const propertyWithDetails = {
      ...property,
      photos: photosResult.rows,
      features: featuresResult.rows.map(f => f.feature_name),
      amenities: amenitiesResult.rows.map(a => a.amenity_name),
      reviews: reviewsResult.rows
    };
    
    res.json({
      success: true,
      data: propertyWithDetails
    });
    
  } catch (error) {
    console.error('Error fetching property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Create new property
export const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      zip_code,
      propertyType,
      property_type,
      bedrooms,
      bathrooms,
      squareFeet,
      square_feet,
      yearBuilt,
      year_built,
      lotSize,
      lot_size,
      price,
      listingType,
      listing_type,
      availableDate,
      available_date,
      owner_id,
      agent_id,
      ownerName,
      ownerEmail,
      ownerPhone,
      ownerPreferredContact,
      features,
      amenities,
      photos,
      status
    } = req.body;
    
    // Log received data for debugging
    console.log('📥 Received request body:', {
      zipCode: zipCode,
      zip_code: zip_code,
      zipCodeType: typeof zipCode,
      zip_codeType: typeof zip_code,
      zipCodeIsNull: zipCode === null,
      zipCodeIsUndefined: zipCode === undefined,
      zipCodeIsEmpty: zipCode === '',
      title: title,
      address: address,
      city: city,
      state: state
    });
    
    // Log the full request body to see what's actually being sent
    console.log('📥 Full request body (first 1000 chars):', JSON.stringify(req.body).substring(0, 1000));
    
    // Validate required fields - ensure zipCode is properly extracted
    // Handle null, undefined, empty string, and the string "null" or "undefined"
    let rawZipCode = zipCode !== undefined && zipCode !== null ? zipCode : (zip_code !== undefined && zip_code !== null ? zip_code : '');
    
    // Convert to string and handle edge cases
    let finalZipCode: string;
    if (rawZipCode === null || rawZipCode === undefined) {
      finalZipCode = '';
    } else if (typeof rawZipCode === 'string') {
      finalZipCode = rawZipCode.trim();
    } else {
      finalZipCode = String(rawZipCode).trim();
    }
    
    // Reject if empty, null, undefined, or the literal strings "null" or "undefined"
    if (!finalZipCode || finalZipCode === '' || finalZipCode === 'null' || finalZipCode === 'undefined') {
      console.error('❌ ZIP CODE VALIDATION FAILED:', {
        zipCode,
        zip_code,
        rawZipCode,
        finalZipCode,
        zipCodeType: typeof zipCode,
        zip_codeType: typeof zip_code,
        zipCodeIsNull: zipCode === null,
        zipCodeIsUndefined: zipCode === undefined,
        zip_codeIsNull: zip_code === null,
        zip_codeIsUndefined: zip_code === undefined
      });
      return res.status(400).json({
        success: false,
        message: 'ZIP code is required and cannot be empty',
        error: `ZIP code validation failed. Received zipCode: ${JSON.stringify(zipCode)} (type: ${typeof zipCode}), zip_code: ${JSON.stringify(zip_code)} (type: ${typeof zip_code})`
      });
    }
    
    // Final validation - ensure it's a valid non-empty string
    if (typeof finalZipCode !== 'string' || finalZipCode.length === 0) {
      console.error('❌ ZIP CODE TYPE VALIDATION FAILED:', {
        finalZipCode,
        type: typeof finalZipCode,
        length: finalZipCode?.length
      });
      return res.status(400).json({
        success: false,
        message: 'ZIP code must be a non-empty string',
        error: `Invalid zipCode type or value. Got: ${JSON.stringify(finalZipCode)} (type: ${typeof finalZipCode})`
      });
    }
    
    // Check other required fields
    if (!title || !description || !address || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, address, city, state, and zipCode are required',
        error: `Missing required field: ${!title ? 'title' : !description ? 'description' : !address ? 'address' : !city ? 'city' : 'state'}`
      });
    }
    
    console.log('✅ Validated zipCode:', finalZipCode, 'Type:', typeof finalZipCode, 'Length:', finalZipCode.length);
    
    // Validate listing type
    const finalListingType = listingType || listing_type;
    const validListingTypes = ['rent', 'sell', 'buy'];
    if (!finalListingType || !validListingTypes.includes(finalListingType)) {
      return res.status(400).json({
        success: false,
        message: `Invalid listing type: ${finalListingType}. Must be one of: ${validListingTypes.join(', ')}`
      });
    }
    
    // Validate price
    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price is required and must be greater than 0'
      });
    }
    
    console.log(`Creating property with listing type: ${finalListingType}`);
    console.log('Property data:', {
      title,
      address,
      city,
      state,
      zipCode: zipCode || zip_code,
      propertyType: propertyType || property_type,
      bedrooms,
      bathrooms,
      squareFeet: squareFeet || square_feet,
      price,
      listingType: finalListingType,
      status: status || 'active',
      photosCount: photos ? photos.length : 0
    });
    
    // Check database constraint for listing_type before attempting insert
    if (finalListingType === 'buy') {
      try {
        const constraintCheck = await pool.query(`
          SELECT conname, pg_get_constraintdef(oid) as definition
          FROM pg_constraint 
          WHERE conname = 'properties_listing_type_check'
          LIMIT 1
        `);
        
        if (constraintCheck.rows.length > 0) {
          const definition = constraintCheck.rows[0].definition;
          console.log('Current listing_type constraint:', definition);
          
          if (!definition.includes("'buy'")) {
            console.warn('Database constraint does not allow "buy" listing type. Attempting to update constraint...');
            try {
              await pool.query(`
                ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_type_check;
                ALTER TABLE properties ADD CONSTRAINT properties_listing_type_check 
                  CHECK (listing_type IN ('rent', 'sell', 'buy'));
              `);
              console.log('✅ Successfully updated database constraint to allow "buy" listing type');
            } catch (constraintError) {
              console.error('Failed to update constraint:', constraintError);
              // Continue anyway - the insert will fail with a clear error message
            }
          }
        }
      } catch (checkError) {
        console.warn('Could not check database constraint:', checkError);
        // Continue anyway
      }
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Insert property - handle both camelCase and snake_case
      // Try to insert with owner_name, owner_email, owner_phone first (newer schema)
      // If that fails, fall back to just owner_id (older schema)
      let propertyResult;
      let property;
      
      // Use the validated finalZipCode from above (already validated and trimmed)
      // Ensure finalZipCode is a string and not null/undefined - do this BEFORE the try block
      console.log('🔍 Before INSERT - finalZipCode value:', finalZipCode);
      console.log('🔍 Before INSERT - finalZipCode type:', typeof finalZipCode);
      console.log('🔍 Before INSERT - finalZipCode length:', finalZipCode ? finalZipCode.length : 'null/undefined');
      
      if (!finalZipCode || (typeof finalZipCode === 'string' && finalZipCode.trim() === '')) {
        throw new Error('ZIP code is required and cannot be empty. Received: ' + JSON.stringify({ zipCode, zip_code, finalZipCode }));
      }
      
      // Ensure finalZipCode is a string and not null/undefined - declare outside try-catch for scope
      // Use the validated finalZipCode directly - it's already been validated above
      const zipCodeForInsert = finalZipCode; // Use the already-validated finalZipCode
      console.log('🔍 zipCodeForInsert (before try):', zipCodeForInsert);
      console.log('🔍 zipCodeForInsert type:', typeof zipCodeForInsert);
      console.log('🔍 zipCodeForInsert length:', zipCodeForInsert ? zipCodeForInsert.length : 'null/undefined');
      console.log('🔍 zipCodeForInsert === finalZipCode:', zipCodeForInsert === finalZipCode);
      
      // Final safety check - this should never fail if validation above worked
      if (!zipCodeForInsert || typeof zipCodeForInsert !== 'string' || zipCodeForInsert.trim() === '' || zipCodeForInsert === 'null' || zipCodeForInsert === 'undefined') {
        console.error('❌❌❌ CRITICAL: zipCodeForInsert failed final validation!');
        console.error('zipCodeForInsert:', zipCodeForInsert);
        console.error('finalZipCode:', finalZipCode);
        console.error('zipCode:', zipCode);
        console.error('zip_code:', zip_code);
        throw new Error('CRITICAL: zipCodeForInsert failed final validation. This should never happen. Value: ' + JSON.stringify(zipCodeForInsert));
      }
      
      // Based on the database schema provided, the table does NOT have owner_name, owner_email, owner_phone columns
      // So we should try the simpler INSERT first (without those columns)
      // This matches the actual database schema: zip_code character varying(10) - which requires NOT NULL based on error
      try {
        // Try the simpler INSERT first (matches the actual database schema)
        const insertValues = [
          title, 
          description, 
          address, 
          city, 
          state, 
          zipCodeForInsert, // Use validated and ensured zipCode
          propertyType || property_type,
          bedrooms, 
          bathrooms, 
          squareFeet || square_feet, 
          yearBuilt || year_built, 
          lotSize || lot_size, 
          price,
          finalListingType,
          availableDate || available_date, 
          owner_id || null, 
          agent_id || null,
          status || 'active'
        ];
        
        console.log('Attempting INSERT (simple schema - no owner_name columns)...');
        console.log('🔍 ZIP CODE VALUE AT POSITION $6:', insertValues[5], 'Type:', typeof insertValues[5], 'Is null?', insertValues[5] === null, 'Is undefined?', insertValues[5] === undefined);
        console.log('🔍 Full insertValues array:', insertValues.map((v, i) => `$${i+1}: ${v === null ? 'NULL' : v === undefined ? 'UNDEFINED' : typeof v === 'string' && v.length > 50 ? v.substring(0, 50) + '...' : v}`).join(', '));
        
        // CRITICAL CHECK: Ensure zipCode is definitely not null/undefined before INSERT
        if (insertValues[5] === null || insertValues[5] === undefined || insertValues[5] === '') {
          console.error('❌❌❌ CRITICAL ERROR: zipCode is NULL/UNDEFINED/EMPTY at position $6!');
          console.error('❌ insertValues[5]:', insertValues[5]);
          console.error('❌ zipCodeForInsert:', zipCodeForInsert);
          console.error('❌ finalZipCode:', finalZipCode);
          console.error('❌ req.body.zipCode:', req.body.zipCode);
          console.error('❌ req.body.zip_code:', req.body.zip_code);
          throw new Error('CRITICAL: zipCode is NULL/UNDEFINED/EMPTY when attempting database INSERT. This should never happen after validation.');
        }
        
        // Double-check: Replace with zipCodeForInsert if somehow it's null
        if (!insertValues[5] || insertValues[5] === null || insertValues[5] === undefined) {
          console.warn('⚠️ WARNING: zipCode at position 5 is null/undefined, replacing with zipCodeForInsert');
          insertValues[5] = zipCodeForInsert;
        }
        
        // Final explicit check - ensure zipCodeForInsert is used directly
        // Don't rely on array indexing - use the validated variable directly
        const finalZipCodeValue = zipCodeForInsert; // This is the validated, non-null value
        console.log('🔍 Using finalZipCodeValue for INSERT:', finalZipCodeValue);
        
        // Rebuild insertValues to ensure zipCode is definitely set
        const finalInsertValues = [
          title, 
          description, 
          address, 
          city, 
          state, 
          finalZipCodeValue, // EXPLICITLY use the validated value
          propertyType || property_type,
          bedrooms, 
          bathrooms, 
          squareFeet || square_feet, 
          yearBuilt || year_built, 
          lotSize || lot_size, 
          price,
          finalListingType,
          availableDate || available_date, 
          owner_id || null, 
          agent_id || null, 
          status || 'active'
        ];
        
        console.log('🔍 Final INSERT values - zip_code at $6:', finalInsertValues[5]);
        console.log('🔍 Final INSERT values - zip_code === finalZipCodeValue:', finalInsertValues[5] === finalZipCodeValue);
        
        propertyResult = await client.query(
        `INSERT INTO properties (
          title, description, address, city, state, zip_code, property_type,
          bedrooms, bathrooms, square_feet, year_built, lot_size, price,
            listing_type, available_date, owner_id, agent_id, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *`,
          finalInsertValues
        );
        
        property = propertyResult.rows[0];
        console.log('✅ Successfully inserted property (simple schema)');
      } catch (insertError: any) {
        console.error('❌ Simple INSERT attempt failed:', insertError.message);
        console.error('❌ Error code:', insertError.code);
        console.error('❌ Full error:', insertError);
        
        // If the simple INSERT fails, try with owner_name columns (in case the schema was updated)
        if (insertError.message && !insertError.message.includes('column "owner_name"') && insertError.code !== '42703') {
          console.log('⚠️ Trying INSERT with owner_name, owner_email, owner_phone columns as fallback...');
          
          const insertValues = [
          title, 
          description, 
          address, 
          city, 
          state, 
            zipCodeForInsert, // Use validated and ensured zipCode
          propertyType || property_type,
          bedrooms, 
          bathrooms, 
          squareFeet || square_feet, 
          yearBuilt || year_built, 
          lotSize || lot_size, 
          price,
            finalListingType,
          availableDate || available_date, 
            owner_id || null, 
            agent_id || null,
            status || 'active',
            ownerName || 'Unknown Owner',
          ownerEmail || '',
          ownerPhone || ''
          ];
          
          console.log('🔍 ZIP CODE VALUE AT POSITION $6 (with owner_name fallback):', insertValues[5], 'Type:', typeof insertValues[5]);
          
          propertyResult = await client.query(
            `INSERT INTO properties (
              title, description, address, city, state, zip_code, property_type,
              bedrooms, bathrooms, square_feet, year_built, lot_size, price,
              listing_type, available_date, owner_id, agent_id, status, owner_name, owner_email, owner_phone
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *`,
            insertValues
          );
          
          property = propertyResult.rows[0];
          console.log('✅ Successfully inserted property with owner_name, owner_email, owner_phone');
        } else {
          // Re-throw the error if it's not something we can handle
          throw insertError;
        }
      }
      
      // Insert features
      if (features && features.length > 0) {
        for (const feature of features) {
          await client.query(
            'INSERT INTO property_features (property_id, feature_name) VALUES ($1, $2)',
            [property.id, feature]
          );
        }
      }
      
      // Insert amenities
      if (amenities && amenities.length > 0) {
        for (const amenity of amenities) {
          await client.query(
            'INSERT INTO property_amenities (property_id, amenity_name) VALUES ($1, $2)',
            [property.id, amenity]
          );
        }
      }
      
      // Insert photos - handle multiple photos
      if (photos && Array.isArray(photos) && photos.length > 0) {
        console.log(`Inserting ${photos.length} photos for property ${property.id}`);
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          // Handle both base64 data URLs and regular URLs
          const photoUrl = photo.url || photo.photo_url || '';
          const photoName = photo.name || photo.photo_name || `photo_${i + 1}.jpg`;
          const photoSize = photo.size || photo.photo_size || 0;
          
          if (photoUrl) {
            await client.query(
              `INSERT INTO property_photos (
                property_id, photo_url, photo_name, photo_size, is_primary, display_order
              ) VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                property.id,
                photoUrl,
                photoName,
                photoSize,
                i === 0, // First photo is primary
                i + 1
              ]
            );
            console.log(`Inserted photo ${i + 1}/${photos.length}: ${photoName}`);
          } else {
            console.warn(`Skipping photo ${i + 1} - no URL provided`);
          }
        }
        console.log(`Successfully inserted ${photos.length} photos`);
      } else {
        console.log('No photos to insert');
      }
      
      await client.query('COMMIT');
      
      // Fetch the complete property with all relations for response
      const completePropertyResult = await client.query(
        'SELECT * FROM properties WHERE id = $1',
        [property.id]
      );
      
      const photosResult = await client.query(
        'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order',
        [property.id]
      );
      
      const featuresResult = await client.query(
        'SELECT feature_name FROM property_features WHERE property_id = $1',
        [property.id]
      );
      
      const amenitiesResult = await client.query(
        'SELECT amenity_name FROM property_amenities WHERE property_id = $1',
        [property.id]
      );
      
      const completeProperty = {
        ...completePropertyResult.rows[0],
        zipCode: completePropertyResult.rows[0].zip_code,
        propertyType: completePropertyResult.rows[0].property_type,
        squareFeet: completePropertyResult.rows[0].square_feet,
        yearBuilt: completePropertyResult.rows[0].year_built,
        lotSize: completePropertyResult.rows[0].lot_size,
        listingType: completePropertyResult.rows[0].listing_type,
        availableDate: completePropertyResult.rows[0].available_date,
        submittedAt: completePropertyResult.rows[0].created_at,
        createdAt: completePropertyResult.rows[0].created_at,
        photos: photosResult.rows.map(p => ({
          id: p.id,
          name: p.photo_name,
          url: p.photo_url,
          size: p.photo_size
        })),
        features: featuresResult.rows.map(f => f.feature_name),
        amenities: amenitiesResult.rows.map(a => a.amenity_name),
        ownerName: ownerName || '',
        ownerEmail: ownerEmail || '',
        ownerPhone: ownerPhone || '',
        ownerPreferredContact: ownerPreferredContact || 'email'
      };
      
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        listing: completeProperty
      });
      
    } catch (dbError) {
      await client.query('ROLLBACK');
      // Re-throw the database error so it can be caught by outer catch
      throw dbError;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('========== ERROR CREATING PROPERTY ==========');
    console.error('Error object:', error);
    console.error('Error type:', typeof error);
    console.error('Error instanceof Error:', error instanceof Error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      // Try to get more details from PostgreSQL error
      const pgError = error as any;
      if (pgError.code) {
        console.error('PostgreSQL error code:', pgError.code);
        console.error('PostgreSQL error detail:', pgError.detail);
        console.error('PostgreSQL error hint:', pgError.hint);
        console.error('PostgreSQL error constraint:', pgError.constraint);
        console.error('PostgreSQL error table:', pgError.table);
        console.error('PostgreSQL error column:', pgError.column);
      }
      // Log the full error object to see if there's more info
      console.error('Full error:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    }
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    console.error('Request listingType:', req.body.listingType || req.body.listing_type);
    console.error('==============================================');
      
    // Extract the actual error message - prioritize specific error details
    // Start with the actual error message, not a generic one
    let errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    let statusCode = 500;
    let detailedError = errorMessage;
    
    if (error instanceof Error) {
      const errorMsg = error.message;
      // Check for PostgreSQL-specific error details
      const pgError = error as any;
      if (pgError.code) {
        // PostgreSQL error codes: https://www.postgresql.org/docs/current/errcodes-appendix.html
        console.error('PostgreSQL Error Code:', pgError.code);
        console.error('PostgreSQL Error Detail:', pgError.detail);
        console.error('PostgreSQL Error Hint:', pgError.hint);
        console.error('PostgreSQL Error Constraint:', pgError.constraint);
        console.error('PostgreSQL Error Column:', pgError.column);
        
        // Use detail if available, then hint, then the error message
        if (pgError.detail) {
          detailedError = `${errorMsg}. Detail: ${pgError.detail}`;
          errorMessage = `${errorMsg}. ${pgError.detail}`;
        } else if (pgError.hint) {
          detailedError = `${errorMsg}. Hint: ${pgError.hint}`;
          errorMessage = `${errorMsg}. ${pgError.hint}`;
        } else {
          detailedError = errorMsg;
          errorMessage = errorMsg;
        }
      } else {
        detailedError = errorMsg;
        errorMessage = errorMsg;
      }
      
      // Database constraint violations - check these BEFORE overwriting errorMessage
      // Use the errorMessage that was set from PostgreSQL detail/hint if available
      if (errorMsg.includes('listing_type_check') || errorMsg.includes('listing_type') || errorMsg.includes('check constraint') || pgError.constraint === 'properties_listing_type_check') {
        const receivedType = req.body.listingType || req.body.listing_type || 'undefined';
        errorMessage = `Database constraint error: Invalid listing type "${receivedType}". The database constraint may not allow 'buy'. Please run the migration: ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_listing_type_check; ALTER TABLE properties ADD CONSTRAINT properties_listing_type_check CHECK (listing_type IN ('rent', 'sell', 'buy'));`;
        statusCode = 400;
      } else if (errorMsg.includes('violates check constraint') || pgError.code === '23514') {
        errorMessage = `Database constraint violation: ${errorMsg}${pgError.detail ? '. ' + pgError.detail : ''}`;
        statusCode = 400;
      } else if (errorMsg.includes('null value') || errorMsg.includes('NOT NULL') || pgError.code === '23502') {
        // Extract the column name from the error if possible
        const columnMatch = errorMsg.match(/column "(\w+)"/);
        const columnName = columnMatch ? columnMatch[1] : (pgError.column || 'unknown');
        errorMessage = `Missing required field: ${columnName}. ${errorMsg}${pgError.detail ? '. ' + pgError.detail : ''}`;
        statusCode = 400;
      } else if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint') || pgError.code === '23505') {
        errorMessage = `Duplicate entry: ${errorMsg}${pgError.detail ? '. ' + pgError.detail : ''}`;
        statusCode = 409;
      } else if (errorMsg.includes('foreign key') || errorMsg.includes('violates foreign key') || pgError.code === '23503') {
        errorMessage = `Invalid reference: ${errorMsg}${pgError.detail ? '. ' + pgError.detail : ''}`;
        statusCode = 400;
      } else if (errorMsg.includes('ECONNREFUSED') || errorMsg.includes('getaddrinfo ENOTFOUND') || 
                 errorMsg.includes('Connection terminated') || errorMsg.includes('socket hang up') ||
                 (errorMsg.includes('timeout') && errorMsg.includes('connection'))) {
        // Only treat as connection error if it's actually a network/database connection issue
        errorMessage = `Database connection error: ${errorMsg}. Please check if the database server is running.`;
        statusCode = 503;
      } else {
        // For any other error, use the actual error message (which may include PostgreSQL detail/hint)
        // errorMessage is already set from pgError.detail or pgError.hint above
        statusCode = 500;
      }
    }
    
    // Always return the detailed error message so frontend can display it
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: detailedError,
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
    });
  }
};

// Create contact inquiry
export const createInquiry = async (req, res) => {
  try {
    const { property_id, name, email, phone, message, inquiry_type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO contact_inquiries (
        property_id, name, email, phone, message, inquiry_type
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [property_id, name, email, phone, message, inquiry_type]
    );
    
    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error creating inquiry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit inquiry',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Update property
export const updateProperty = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      address,
      city,
      state,
      zipCode,
      zip_code,
      propertyType,
      property_type,
      bedrooms,
      bathrooms,
      squareFeet,
      square_feet,
      yearBuilt,
      year_built,
      lotSize,
      lot_size,
      price,
      listingType,
      listing_type,
      availableDate,
      available_date,
      features,
      amenities,
      photos,
      ownerName,
      ownerEmail,
      ownerPhone,
      status
    } = req.body;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if property exists
      const propertyCheck = await client.query(
        'SELECT * FROM properties WHERE id = $1',
        [id]
      );
      
      if (propertyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Update property
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;
      
      if (title !== undefined) {
        updateFields.push(`title = $${paramCount++}`);
        updateValues.push(title);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramCount++}`);
        updateValues.push(description);
      }
      if (address !== undefined) {
        updateFields.push(`address = $${paramCount++}`);
        updateValues.push(address);
      }
      if (city !== undefined) {
        updateFields.push(`city = $${paramCount++}`);
        updateValues.push(city);
      }
      if (state !== undefined) {
        updateFields.push(`state = $${paramCount++}`);
        updateValues.push(state);
      }
      if (zipCode !== undefined || zip_code !== undefined) {
        updateFields.push(`zip_code = $${paramCount++}`);
        updateValues.push(zipCode || zip_code);
      }
      if (propertyType !== undefined || property_type !== undefined) {
        updateFields.push(`property_type = $${paramCount++}`);
        updateValues.push(propertyType || property_type);
      }
      if (bedrooms !== undefined) {
        updateFields.push(`bedrooms = $${paramCount++}`);
        updateValues.push(bedrooms);
      }
      if (bathrooms !== undefined) {
        updateFields.push(`bathrooms = $${paramCount++}`);
        updateValues.push(bathrooms);
      }
      if (squareFeet !== undefined || square_feet !== undefined) {
        updateFields.push(`square_feet = $${paramCount++}`);
        updateValues.push(squareFeet || square_feet);
      }
      if (yearBuilt !== undefined || year_built !== undefined) {
        updateFields.push(`year_built = $${paramCount++}`);
        updateValues.push(yearBuilt || year_built);
      }
      if (lotSize !== undefined || lot_size !== undefined) {
        updateFields.push(`lot_size = $${paramCount++}`);
        updateValues.push(lotSize || lot_size);
      }
      if (price !== undefined) {
        updateFields.push(`price = $${paramCount++}`);
        updateValues.push(price);
      }
      if (listingType !== undefined || listing_type !== undefined) {
        updateFields.push(`listing_type = $${paramCount++}`);
        updateValues.push(listingType || listing_type);
      }
      if (availableDate !== undefined || available_date !== undefined) {
        updateFields.push(`available_date = $${paramCount++}`);
        updateValues.push(availableDate || available_date);
      }
      if (status !== undefined) {
        updateFields.push(`status = $${paramCount++}`);
        updateValues.push(status);
      }
      
      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);
      
      if (updateFields.length > 1) {
        const updateQuery = `
          UPDATE properties 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramCount}
          RETURNING *
        `;
        
        const propertyResult = await client.query(updateQuery, updateValues);
        const property = propertyResult.rows[0];
        
        // Update features
        if (features !== undefined) {
          // Delete existing features
          await client.query(
            'DELETE FROM property_features WHERE property_id = $1',
            [id]
          );
          // Insert new features
          if (Array.isArray(features) && features.length > 0) {
            for (const feature of features) {
              await client.query(
                'INSERT INTO property_features (property_id, feature_name) VALUES ($1, $2)',
                [id, feature]
              );
            }
          }
        }
        
        // Update amenities
        if (amenities !== undefined) {
          // Delete existing amenities
          await client.query(
            'DELETE FROM property_amenities WHERE property_id = $1',
            [id]
          );
          // Insert new amenities
          if (Array.isArray(amenities) && amenities.length > 0) {
            for (const amenity of amenities) {
              await client.query(
                'INSERT INTO property_amenities (property_id, amenity_name) VALUES ($1, $2)',
                [id, amenity]
              );
            }
          }
        }
        
        // Update photos - handle multiple photos
        if (photos !== undefined) {
          // Delete existing photos
          await client.query(
            'DELETE FROM property_photos WHERE property_id = $1',
            [id]
          );
          // Insert new photos
          if (Array.isArray(photos) && photos.length > 0) {
            console.log(`Updating ${photos.length} photos for property ${id}`);
            for (let i = 0; i < photos.length; i++) {
              const photo = photos[i];
              // Handle both base64 data URLs and regular URLs
              const photoUrl = photo.url || photo.photo_url || '';
              const photoName = photo.name || photo.photo_name || `photo_${i + 1}.jpg`;
              const photoSize = photo.size || photo.photo_size || 0;
              
              if (photoUrl) {
                await client.query(
                  `INSERT INTO property_photos (
                    property_id, photo_url, photo_name, photo_size, is_primary, display_order
                  ) VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    id,
                    photoUrl,
                    photoName,
                    photoSize,
                    i === 0, // First photo is primary
                    i + 1
                  ]
                );
                console.log(`Updated photo ${i + 1}/${photos.length}: ${photoName}`);
              } else {
                console.warn(`Skipping photo ${i + 1} - no URL provided`);
              }
            }
            console.log(`Successfully updated ${photos.length} photos`);
          } else {
            console.log('No photos to update');
          }
        }
        
        await client.query('COMMIT');
        
        // Fetch updated property with all relations
        const updatedPropertyResult = await client.query(
          'SELECT * FROM properties WHERE id = $1',
          [id]
        );
        
        const photosResult = await client.query(
          'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order',
          [id]
        );
        
        const featuresResult = await client.query(
          'SELECT feature_name FROM property_features WHERE property_id = $1',
          [id]
        );
        
        const amenitiesResult = await client.query(
          'SELECT amenity_name FROM property_amenities WHERE property_id = $1',
          [id]
        );
        
        const updatedProperty = {
          ...updatedPropertyResult.rows[0],
          photos: photosResult.rows,
          features: featuresResult.rows.map(f => f.feature_name),
          amenities: amenitiesResult.rows.map(a => a.amenity_name)
        };
        
        res.json({
          success: true,
          message: 'Property updated successfully',
          data: updatedProperty
        });
      } else {
        await client.query('ROLLBACK');
        res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error updating property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Delete property
export const deleteProperty = async (req, res) => {
  try {
    const { id } = req.params;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if property exists
      const propertyCheck = await client.query(
        'SELECT * FROM properties WHERE id = $1',
        [id]
      );
      
      if (propertyCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({
          success: false,
          message: 'Property not found'
        });
      }
      
      // Delete related records
      await client.query('DELETE FROM property_features WHERE property_id = $1', [id]);
      await client.query('DELETE FROM property_amenities WHERE property_id = $1', [id]);
      await client.query('DELETE FROM property_photos WHERE property_id = $1', [id]);
      await client.query('DELETE FROM contact_inquiries WHERE property_id = $1', [id]);
      await client.query('DELETE FROM reviews WHERE property_id = $1', [id]);
      
      // Delete property
      await client.query('DELETE FROM properties WHERE id = $1', [id]);
      
      await client.query('COMMIT');
      
      res.json({
        success: true,
        message: 'Property deleted successfully'
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error deleting property:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete property',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get properties by owner email
export const getPropertiesByOwner = async (req, res) => {
  try {
    const { ownerEmail } = req.query;
    
    if (!ownerEmail) {
      return res.status(400).json({
        success: false,
        message: 'ownerEmail query parameter is required'
      });
    }
    
    // Only fetch listings from Buy, Rent, and Sell pages (listing_type IN ('rent', 'sell', 'buy'))
    // and only show active or inactive listings (status IN ('active', 'inactive'))
    let query = `
      SELECT 
        p.*,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.phone as owner_phone,
        u.email as owner_email
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE (u.email = $1 OR p.owner_email = $1)
        AND p.listing_type IN ('rent', 'sell', 'buy')
        AND p.status IN ('active', 'inactive')
    `;
    
    const result = await pool.query(query, [ownerEmail]);
    
    // Get photos, features, and amenities for each property
    const propertiesWithDetails = await Promise.all(
      result.rows.map(async (property) => {
        const photosResult = await pool.query(
          'SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order',
          [property.id]
        );
        
        const featuresResult = await pool.query(
          'SELECT feature_name FROM property_features WHERE property_id = $1',
          [property.id]
        );
        
        const amenitiesResult = await pool.query(
          'SELECT amenity_name FROM property_amenities WHERE property_id = $1',
          [property.id]
        );
        
        // Map database fields to frontend format
        const mappedProperty = {
          id: property.id,
          title: property.title || '',
          description: property.description || '',
          address: property.address || '',
          city: property.city || '',
          state: property.state || '',
          zipCode: property.zip_code || property.zipCode || '',
          propertyType: property.property_type || property.propertyType || '',
          bedrooms: property.bedrooms || 0,
          bathrooms: property.bathrooms || 0,
          squareFeet: property.square_feet || property.squareFeet || 0,
          yearBuilt: property.year_built || property.yearBuilt,
          lotSize: property.lot_size || property.lotSize || 0,
          price: property.price || 0,
          listingType: property.listing_type || property.listingType || 'rent',
          status: property.status || 'Draft',
          availableDate: property.available_date || property.availableDate,
          photos: photosResult.rows.map(p => ({
            id: p.id,
            name: p.photo_name || p.name || '',
            url: p.photo_url || p.url || '',
            size: p.photo_size || p.size || 0
          })),
          features: featuresResult.rows.map(f => f.feature_name).filter(Boolean),
          amenities: amenitiesResult.rows.map(a => a.amenity_name).filter(Boolean),
          ownerName: property.owner_name || property.owner_first_name + ' ' + (property.owner_last_name || '') || '',
          ownerEmail: property.owner_email || property.ownerEmail || '',
          ownerPhone: property.owner_phone || property.ownerPhone || '',
          ownerPreferredContact: property.owner_preferred_contact || property.ownerPreferredContact || 'email',
          submittedAt: property.submitted_at || property.submittedAt || property.created_at || property.createdAt,
          createdAt: property.created_at || property.createdAt,
          updatedAt: property.updated_at || property.updatedAt
        };
        
        return mappedProperty;
      })
    );
    
    res.json({
      success: true,
      listings: propertiesWithDetails,
      total: propertiesWithDetails.length
    });
    
  } catch (error) {
    console.error('Error fetching properties by owner:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Get reviews for a property
export const getPropertyReviews = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM reviews WHERE property_id = $1 ORDER BY created_at DESC',
      [id]
    );
    
    res.json({
      success: true,
      data: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
