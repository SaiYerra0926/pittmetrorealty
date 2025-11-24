import pool from '../src/lib/database.js';

// Auto-migrate photo_url column on startup (if needed)
(async () => {
  try {
    const client = await pool.connect();
    try {
      // Check if column is still VARCHAR(500)
      const columnInfo = await client.query(`
        SELECT data_type, character_maximum_length 
        FROM information_schema.columns 
        WHERE table_name = 'property_photos' 
        AND column_name = 'photo_url'
      `);
      
      if (columnInfo.rows.length > 0) {
        const currentType = columnInfo.rows[0].data_type;
        const currentLength = columnInfo.rows[0].character_maximum_length;
        
        // If it's VARCHAR with a length limit, migrate to TEXT
        if (currentType === 'character varying' && currentLength) {
          console.log('🔄 Auto-migrating photo_url column from VARCHAR(500) to TEXT...');
          await client.query('ALTER TABLE property_photos ALTER COLUMN photo_url TYPE TEXT');
          console.log('✅ Migration completed: photo_url is now TEXT');
        } else if (currentType === 'text') {
          console.log('✅ photo_url column is already TEXT - no migration needed');
        }
      }
    } catch (migrationError) {
      console.warn('⚠️  Could not auto-migrate photo_url column:', migrationError.message);
      console.warn('   Please run the migration manually: node run-migration.mjs');
    } finally {
      client.release();
    }
  } catch (error) {
    console.warn('⚠️  Could not check/migrate database schema:', error.message);
    console.warn('   Please run the migration manually: node run-migration.mjs');
  }
})();

// Get all properties
export const getProperties = async (req, res) => {
  // Set a timeout for the request
  const timeout = setTimeout(() => {
    if (!res.headersSent) {
      console.log('⚠️ Request timeout - returning empty result');
      res.status(200).json({
        success: true,
        listings: [],
        total: 0,
        message: 'Database connection timeout. Please try again.'
      });
    }
  }, 8000); // 8 second timeout

  try {
    console.log('📥 Received request to get properties');
    const { type, status, minPrice, maxPrice, bedrooms, bathrooms, city } = req.query;
    
    // Test database connection first with retry
    console.log('🔌 Testing database connection...');
    let client;
    let connectionAttempts = 0;
    const maxConnectionAttempts = 3;
    
    while (connectionAttempts < maxConnectionAttempts) {
      try {
        connectionAttempts++;
        console.log(`   Connection attempt ${connectionAttempts}/${maxConnectionAttempts}...`);
        
        client = await Promise.race([
          pool.connect(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout after 8 seconds')), 8000))
        ]);
        
        console.log('✅ Database connection established');
        break; // Success, exit retry loop
      } catch (connError) {
        console.error(`   Attempt ${connectionAttempts} failed:`, connError.message);
        
        if (connectionAttempts >= maxConnectionAttempts) {
          clearTimeout(timeout);
          console.error('❌ All database connection attempts failed');
          if (!res.headersSent) {
            return res.status(200).json({
              success: true,
              listings: [],
              total: 0,
              message: `Database connection failed after ${maxConnectionAttempts} attempts. Please check database configuration and credentials.`
            });
          }
          return;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * connectionAttempts));
      }
    }
    
    if (!client) {
      clearTimeout(timeout);
      if (!res.headersSent) {
        return res.status(200).json({
          success: true,
          listings: [],
          total: 0,
          message: 'Failed to establish database connection.'
        });
      }
      return;
    }
    
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
      WHERE 1=1
    `;
    
    const params = [];
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
      params.push(parseFloat(minPrice));
      paramCount++;
    }
    
    if (maxPrice) {
      query += ` AND p.price <= $${paramCount}`;
      params.push(parseFloat(maxPrice));
      paramCount++;
    }
    
    if (bedrooms) {
      query += ` AND p.bedrooms >= $${paramCount}`;
      params.push(parseInt(bedrooms));
      paramCount++;
    }
    
    if (bathrooms) {
      query += ` AND p.bathrooms >= $${paramCount}`;
      params.push(parseFloat(bathrooms));
      paramCount++;
    }
    
    if (city) {
      query += ` AND p.city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }
    
    query += ` ORDER BY p.created_at DESC`;
    
    console.log('📊 Executing query for properties...');
    let result;
    try {
      result = await Promise.race([
        client.query(query, params),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Query timeout')), 5000))
      ]);
      console.log(`✅ Query executed successfully. Found ${result.rows.length} properties`);
    } catch (queryError) {
      client.release();
      clearTimeout(timeout);
      console.error('❌ Query execution failed:', queryError.message);
      if (!res.headersSent) {
        return res.status(200).json({
          success: true,
          listings: [],
          total: 0,
          message: `Query failed: ${queryError.message}`
        });
      }
      return;
    }
    
    // Get photos for each property
    console.log('📸 Fetching photos, features, and amenities...');
    const propertiesWithPhotos = await Promise.all(
      result.rows.map(async (property) => {
        try {
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
          
          return {
            ...property,
            photos: photosResult.rows,
            features: featuresResult.rows.map(f => f.feature_name),
            amenities: amenitiesResult.rows.map(a => a.amenity_name)
          };
        } catch (err) {
          console.error(`Error fetching details for property ${property.id}:`, err.message);
          return {
            ...property,
            photos: [],
            features: [],
            amenities: []
          };
        }
      })
    );
    
    // Release the client
    client.release();
    
    // Map database fields to frontend format
    const mappedProperties = propertiesWithPhotos.map((property) => ({
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
      // Include latitude/longitude for map functionality
      latitude: property.latitude || null,
      longitude: property.longitude || null,
      // Also include as coordinates object for convenience
      coordinates: (property.latitude && property.longitude) ? {
        lat: parseFloat(property.latitude),
        lng: parseFloat(property.longitude)
      } : null,
      photos: property.photos.map(p => ({
        id: p.id,
        name: p.photo_name || p.name || '',
        url: p.photo_url || p.url || '',
        size: p.photo_size || p.size || 0
      })),
      features: property.features || [],
      amenities: property.amenities || [],
      ownerName: property.owner_name || (property.owner_first_name ? `${property.owner_first_name} ${property.owner_last_name || ''}`.trim() : '') || '',
      ownerEmail: property.owner_email || property.ownerEmail || '',
      ownerPhone: property.owner_phone || property.ownerPhone || ''
    }));
    
    clearTimeout(timeout);
    if (!res.headersSent) {
      console.log(`✅ Returning ${mappedProperties.length} properties to client`);
      res.json({
        success: true,
        listings: mappedProperties,
        total: mappedProperties.length
      });
    }
    
  } catch (error) {
    clearTimeout(timeout);
    console.error('❌ Error fetching properties:', error);
    if (!res.headersSent) {
      res.status(200).json({
        success: true,
        listings: [],
        total: 0,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
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
      zipCode,  // camelCase from frontend
      zip_code, // snake_case fallback
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
      propertyType: propertyType,
      property_type: property_type,
      propertyTypeType: typeof propertyType,
      property_typeType: typeof property_type,
      propertyTypeIsNull: propertyType === null,
      propertyTypeIsUndefined: propertyType === undefined,
      propertyTypeIsEmpty: propertyType === '',
      listingType: listingType,
      listing_type: listing_type,
      listingTypeType: typeof listingType,
      listing_typeType: typeof listing_type,
      listingTypeIsNull: listingType === null,
      listingTypeIsUndefined: listingType === undefined,
      listingTypeIsEmpty: listingType === '',
      bedrooms: bedrooms,
      bathrooms: bathrooms,
      squareFeet: squareFeet,
      square_feet: square_feet,
      price: price,
      title: title,
      address: address,
      city: city,
      state: state
    });
    
    // Validate required fields - ensure zipCode is properly extracted
    // Handle null, undefined, empty string, and the string "null" or "undefined"
    let rawZipCode = zipCode !== undefined && zipCode !== null ? zipCode : (zip_code !== undefined && zip_code !== null ? zip_code : '');
    
    // Convert to string and handle edge cases
    let finalZipCode;
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
        zip_codeType: typeof zip_code
      });
      return res.status(400).json({
        success: false,
        message: 'ZIP code is required and cannot be empty',
        error: `ZIP code validation failed. Received zipCode: ${JSON.stringify(zipCode)} (type: ${typeof zipCode}), zip_code: ${JSON.stringify(zip_code)} (type: ${typeof zip_code})`
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
    
    // Validate property_type - ensure it's properly extracted
    // Handle null, undefined, empty string, and the string "null" or "undefined"
    let rawPropertyType = propertyType !== undefined && propertyType !== null ? propertyType : (property_type !== undefined && property_type !== null ? property_type : '');
    
    // Convert to string and handle edge cases
    let finalPropertyType;
    if (rawPropertyType === null || rawPropertyType === undefined) {
      finalPropertyType = '';
    } else if (typeof rawPropertyType === 'string') {
      finalPropertyType = rawPropertyType.trim();
    } else {
      finalPropertyType = String(rawPropertyType).trim();
    }
    
    // Reject if empty, null, undefined, or the literal strings "null" or "undefined"
    if (!finalPropertyType || finalPropertyType === '' || finalPropertyType === 'null' || finalPropertyType === 'undefined') {
      console.error('❌ PROPERTY TYPE VALIDATION FAILED:', {
        propertyType,
        property_type,
        rawPropertyType,
        finalPropertyType,
        propertyTypeType: typeof propertyType,
        property_typeType: typeof property_type
      });
      return res.status(400).json({
        success: false,
        message: 'Property type is required and cannot be empty',
        error: `Property type validation failed. Received propertyType: ${JSON.stringify(propertyType)} (type: ${typeof propertyType}), property_type: ${JSON.stringify(property_type)} (type: ${typeof property_type})`
      });
    }
    
    // Final validation - ensure it's a valid non-empty string
    if (typeof finalPropertyType !== 'string' || finalPropertyType.length === 0) {
      console.error('❌ PROPERTY TYPE TYPE VALIDATION FAILED:', {
        finalPropertyType,
        type: typeof finalPropertyType,
        length: finalPropertyType?.length
      });
      return res.status(400).json({
        success: false,
        message: 'Property type must be a non-empty string',
        error: `Invalid propertyType type or value. Got: ${JSON.stringify(finalPropertyType)} (type: ${typeof finalPropertyType})`
      });
    }
    
    console.log('✅ Validated propertyType:', finalPropertyType, 'Type:', typeof finalPropertyType, 'Length:', finalPropertyType.length);
    
    // Validate square_feet - ensure it's properly extracted
    // Handle null, undefined, empty, and convert to number
    let rawSquareFeet = squareFeet !== undefined && squareFeet !== null ? squareFeet : (square_feet !== undefined && square_feet !== null ? square_feet : 0);
    
    // Convert to number and handle edge cases
    let finalSquareFeet;
    if (rawSquareFeet === null || rawSquareFeet === undefined || rawSquareFeet === '') {
      finalSquareFeet = 0;
    } else {
      finalSquareFeet = Number(rawSquareFeet);
      if (isNaN(finalSquareFeet) || finalSquareFeet <= 0) {
        finalSquareFeet = 0;
      }
    }
    
    // Reject if zero or invalid
    if (!finalSquareFeet || finalSquareFeet <= 0) {
      console.error('❌ SQUARE FEET VALIDATION FAILED:', {
        squareFeet,
        square_feet,
        rawSquareFeet,
        finalSquareFeet,
        squareFeetType: typeof squareFeet,
        square_feetType: typeof square_feet
      });
      return res.status(400).json({
        success: false,
        message: 'Square feet is required and must be greater than 0',
        error: `Square feet validation failed. Received squareFeet: ${JSON.stringify(squareFeet)} (type: ${typeof squareFeet}), square_feet: ${JSON.stringify(square_feet)} (type: ${typeof square_feet})`
      });
    }
    
    console.log('✅ Validated squareFeet:', finalSquareFeet, 'Type:', typeof finalSquareFeet);
    
    // Validate listing_type - ensure it's properly extracted
    // Handle null, undefined, empty string, and the string "null" or "undefined"
    let rawListingType = listingType !== undefined && listingType !== null ? listingType : (listing_type !== undefined && listing_type !== null ? listing_type : '');
    
    // Convert to string and handle edge cases
    let finalListingType;
    if (rawListingType === null || rawListingType === undefined) {
      finalListingType = '';
    } else if (typeof rawListingType === 'string') {
      finalListingType = rawListingType.trim().toLowerCase();
    } else {
      finalListingType = String(rawListingType).trim().toLowerCase();
    }
    
    // Validate against allowed values
    const validListingTypes = ['rent', 'sell', 'buy'];
    if (!finalListingType || finalListingType === '' || finalListingType === 'null' || finalListingType === 'undefined' || !validListingTypes.includes(finalListingType)) {
      console.error('❌ LISTING TYPE VALIDATION FAILED:', {
        listingType,
        listing_type,
        rawListingType,
        finalListingType,
        listingTypeType: typeof listingType,
        listing_typeType: typeof listing_type
      });
      return res.status(400).json({
        success: false,
        message: `Listing type is required and must be one of: ${validListingTypes.join(', ')}`,
        error: `Listing type validation failed. Received listingType: ${JSON.stringify(listingType)} (type: ${typeof listingType}), listing_type: ${JSON.stringify(listing_type)} (type: ${typeof listing_type}). Valid values: ${validListingTypes.join(', ')}`
      });
    }
    
    console.log('✅ Validated listingType:', finalListingType, 'Type:', typeof finalListingType);
    
    // Validate bedrooms - ensure it's properly extracted and is a number > 0
    let rawBedrooms = bedrooms !== undefined && bedrooms !== null ? bedrooms : 0;
    let finalBedrooms = Number(rawBedrooms);
    if (isNaN(finalBedrooms) || finalBedrooms <= 0) {
      console.error('❌ BEDROOMS VALIDATION FAILED:', {
        bedrooms,
        rawBedrooms,
        finalBedrooms,
        bedroomsType: typeof bedrooms
      });
      return res.status(400).json({
        success: false,
        message: 'Bedrooms is required and must be greater than 0',
        error: `Bedrooms validation failed. Received bedrooms: ${JSON.stringify(bedrooms)} (type: ${typeof bedrooms})`
      });
    }
    console.log('✅ Validated bedrooms:', finalBedrooms, 'Type:', typeof finalBedrooms);
    
    // Validate bathrooms - ensure it's properly extracted and is a number > 0
    let rawBathrooms = bathrooms !== undefined && bathrooms !== null ? bathrooms : 0;
    let finalBathrooms = Number(rawBathrooms);
    if (isNaN(finalBathrooms) || finalBathrooms <= 0) {
      console.error('❌ BATHROOMS VALIDATION FAILED:', {
        bathrooms,
        rawBathrooms,
        finalBathrooms,
        bathroomsType: typeof bathrooms
      });
      return res.status(400).json({
        success: false,
        message: 'Bathrooms is required and must be greater than 0',
        error: `Bathrooms validation failed. Received bathrooms: ${JSON.stringify(bathrooms)} (type: ${typeof bathrooms})`
      });
    }
    console.log('✅ Validated bathrooms:', finalBathrooms, 'Type:', typeof finalBathrooms);
    
    // Validate price - ensure it's properly extracted and is a number > 0
    let rawPrice = price !== undefined && price !== null ? price : 0;
    let finalPrice = Number(rawPrice);
    if (isNaN(finalPrice) || finalPrice <= 0) {
      console.error('❌ PRICE VALIDATION FAILED:', {
        price,
        rawPrice,
        finalPrice,
        priceType: typeof price
      });
      return res.status(400).json({
        success: false,
        message: 'Price is required and must be greater than 0',
        error: `Price validation failed. Received price: ${JSON.stringify(price)} (type: ${typeof price})`
      });
    }
    console.log('✅ Validated price:', finalPrice, 'Type:', typeof finalPrice);
    
    // Validate string field lengths to prevent "value too long" errors
    // Title: VARCHAR(255)
    if (title && title.length > 255) {
      console.error('❌ TITLE TOO LONG:', { titleLength: title.length, maxLength: 255 });
      return res.status(400).json({
        success: false,
        message: 'Title is too long. Maximum length is 255 characters.',
        error: `Title length: ${title.length} characters (max: 255)`
      });
    }
    
    // Address: VARCHAR(255)
    if (address && address.length > 255) {
      console.error('❌ ADDRESS TOO LONG:', { addressLength: address.length, maxLength: 255 });
      return res.status(400).json({
        success: false,
        message: 'Address is too long. Maximum length is 255 characters.',
        error: `Address length: ${address.length} characters (max: 255)`
      });
    }
    
    // City: VARCHAR(100)
    if (city && city.length > 100) {
      console.error('❌ CITY TOO LONG:', { cityLength: city.length, maxLength: 100 });
      return res.status(400).json({
        success: false,
        message: 'City name is too long. Maximum length is 100 characters.',
        error: `City length: ${city.length} characters (max: 100)`
      });
    }
    
    // State: VARCHAR(50)
    if (state && state.length > 50) {
      console.error('❌ STATE TOO LONG:', { stateLength: state.length, maxLength: 50 });
      return res.status(400).json({
        success: false,
        message: 'State name is too long. Maximum length is 50 characters.',
        error: `State length: ${state.length} characters (max: 50)`
      });
    }
    
    // Property Type: VARCHAR(50) or VARCHAR(100) depending on schema
    if (finalPropertyType && finalPropertyType.length > 100) {
      console.error('❌ PROPERTY TYPE TOO LONG:', { propertyTypeLength: finalPropertyType.length, maxLength: 100 });
      return res.status(400).json({
        success: false,
        message: 'Property type is too long. Maximum length is 100 characters.',
        error: `Property type length: ${finalPropertyType.length} characters (max: 100)`
      });
    }
    
    // Zip Code: VARCHAR(10) or VARCHAR(20) depending on schema
    if (finalZipCode && finalZipCode.length > 20) {
      console.error('❌ ZIP CODE TOO LONG:', { zipCodeLength: finalZipCode.length, maxLength: 20 });
      return res.status(400).json({
        success: false,
        message: 'ZIP code is too long. Maximum length is 20 characters.',
        error: `ZIP code length: ${finalZipCode.length} characters (max: 20)`
      });
    }
    
    // Validate photo URLs before insertion (TEXT column - no length limit, but reasonable size check)
    // Note: Database column is now TEXT, so we can store larger base64 strings
    // Still validate to prevent extremely large uploads (max 5MB base64 = ~6.7MB file)
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        const photoUrl = photo.url || '';
        // Check for extremely large base64 strings (5MB = ~5,242,880 characters)
        const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB in characters
        if (photoUrl.length > MAX_BASE64_SIZE) {
          const sizeMB = (photoUrl.length / (1024 * 1024)).toFixed(2);
          console.error(`❌ PHOTO URL TOO LARGE: Photo ${i + 1} base64 size: ${sizeMB}MB (max: 5MB)`);
          return res.status(400).json({
            success: false,
            message: `Photo ${i + 1} is too large (${sizeMB}MB). Maximum size is 5MB. Please compress or resize the image.`,
            error: `Photo ${i + 1} base64 size: ${photoUrl.length} characters (max: ${MAX_BASE64_SIZE}). Please use smaller images.`
          });
        }
      }
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Use the validated finalZipCode - ensure it's definitely not null
      const zipCodeForInsert = finalZipCode;
      console.log('🔍 Using zipCodeForInsert for INSERT:', zipCodeForInsert);
      
      // Insert property - try simple schema first (matches actual database)
      let propertyResult;
      let property;
      
      try {
        // Use validated propertyType - ensure it's definitely not null
        const propertyTypeForInsert = finalPropertyType;
        console.log('🔍 Using propertyTypeForInsert for INSERT:', propertyTypeForInsert);
        
        // Use validated squareFeet - ensure it's definitely not null
        const squareFeetForInsert = finalSquareFeet;
        console.log('🔍 Using squareFeetForInsert for INSERT:', squareFeetForInsert);
        
        // Use validated bedrooms, bathrooms, price, and listingType
        const bedroomsForInsert = finalBedrooms;
        const bathroomsForInsert = finalBathrooms;
        const priceForInsert = finalPrice;
        const listingTypeForInsert = finalListingType;
        console.log('🔍 Using bedroomsForInsert for INSERT:', bedroomsForInsert);
        console.log('🔍 Using bathroomsForInsert for INSERT:', bathroomsForInsert);
        console.log('🔍 Using priceForInsert for INSERT:', priceForInsert);
        console.log('🔍 Using listingTypeForInsert for INSERT:', listingTypeForInsert);
        
        const insertValues = [
          title, 
          description, 
          address, 
          city, 
          state, 
          zipCodeForInsert, // Use validated zipCode
          propertyTypeForInsert, // Use validated propertyType
          bedroomsForInsert, // Use validated bedrooms
          bathroomsForInsert, // Use validated bathrooms
          squareFeetForInsert, // Use validated squareFeet 
          yearBuilt || year_built, 
          lotSize || lot_size, 
          priceForInsert, // Use validated price
          listingTypeForInsert, // Use validated listingType
          availableDate || available_date, 
          owner_id || null, 
          agent_id || null, 
          status || 'active'
        ];
        
        console.log('🔍 ZIP CODE VALUE AT POSITION $6:', insertValues[5], 'Type:', typeof insertValues[5]);
        console.log('🔍 PROPERTY TYPE VALUE AT POSITION $7:', insertValues[6], 'Type:', typeof insertValues[6]);
        console.log('🔍 BEDROOMS VALUE AT POSITION $8:', insertValues[7], 'Type:', typeof insertValues[7]);
        console.log('🔍 BATHROOMS VALUE AT POSITION $9:', insertValues[8], 'Type:', typeof insertValues[8]);
        console.log('🔍 SQUARE FEET VALUE AT POSITION $10:', insertValues[9], 'Type:', typeof insertValues[9]);
        console.log('🔍 PRICE VALUE AT POSITION $13:', insertValues[12], 'Type:', typeof insertValues[12]);
        console.log('🔍 LISTING TYPE VALUE AT POSITION $14:', insertValues[13], 'Type:', typeof insertValues[13]);
        
        // CRITICAL CHECK: Ensure zipCode is definitely not null/undefined before INSERT
        if (insertValues[5] === null || insertValues[5] === undefined || insertValues[5] === '') {
          console.error('❌❌❌ CRITICAL ERROR: zipCode is NULL/UNDEFINED/EMPTY at position $6!');
          throw new Error('CRITICAL: zipCode is NULL/UNDEFINED/EMPTY when attempting database INSERT.');
        }
        
        // CRITICAL CHECK: Ensure propertyType is definitely not null/undefined before INSERT
        if (insertValues[6] === null || insertValues[6] === undefined || insertValues[6] === '') {
          console.error('❌❌❌ CRITICAL ERROR: propertyType is NULL/UNDEFINED/EMPTY at position $7!');
          throw new Error('CRITICAL: propertyType is NULL/UNDEFINED/EMPTY when attempting database INSERT.');
        }
        
        // CRITICAL CHECK: Ensure bedrooms is definitely not null/undefined/zero before INSERT
        if (insertValues[7] === null || insertValues[7] === undefined || insertValues[7] === 0 || insertValues[7] === '') {
          console.error('❌❌❌ CRITICAL ERROR: bedrooms is NULL/UNDEFINED/ZERO at position $8!');
          throw new Error('CRITICAL: bedrooms is NULL/UNDEFINED/ZERO when attempting database INSERT.');
        }
        
        // CRITICAL CHECK: Ensure bathrooms is definitely not null/undefined/zero before INSERT
        if (insertValues[8] === null || insertValues[8] === undefined || insertValues[8] === 0 || insertValues[8] === '') {
          console.error('❌❌❌ CRITICAL ERROR: bathrooms is NULL/UNDEFINED/ZERO at position $9!');
          throw new Error('CRITICAL: bathrooms is NULL/UNDEFINED/ZERO when attempting database INSERT.');
        }
        
        // CRITICAL CHECK: Ensure squareFeet is definitely not null/undefined/zero before INSERT
        if (insertValues[9] === null || insertValues[9] === undefined || insertValues[9] === 0 || insertValues[9] === '') {
          console.error('❌❌❌ CRITICAL ERROR: squareFeet is NULL/UNDEFINED/ZERO at position $10!');
          throw new Error('CRITICAL: squareFeet is NULL/UNDEFINED/ZERO when attempting database INSERT.');
        }
        
        // CRITICAL CHECK: Ensure price is definitely not null/undefined/zero before INSERT
        if (insertValues[12] === null || insertValues[12] === undefined || insertValues[12] === 0 || insertValues[12] === '') {
          console.error('❌❌❌ CRITICAL ERROR: price is NULL/UNDEFINED/ZERO at position $13!');
          throw new Error('CRITICAL: price is NULL/UNDEFINED/ZERO when attempting database INSERT.');
        }
        
        // CRITICAL CHECK: Ensure listingType is definitely not null/undefined/empty before INSERT
        if (insertValues[13] === null || insertValues[13] === undefined || insertValues[13] === '' || insertValues[13] === 'null' || insertValues[13] === 'undefined') {
          console.error('❌❌❌ CRITICAL ERROR: listingType is NULL/UNDEFINED/EMPTY at position $14!');
          throw new Error('CRITICAL: listingType is NULL/UNDEFINED/EMPTY when attempting database INSERT.');
        }
        
        // Extract latitude and longitude from request body
        const latitude = req.body.latitude || req.body.lat || null;
        const longitude = req.body.longitude || req.body.lng || req.body.lon || null;
        
        // Validate coordinates if provided
        let finalLatitude = null;
        let finalLongitude = null;
        if (latitude !== null && latitude !== undefined && longitude !== null && longitude !== undefined) {
          const lat = parseFloat(latitude);
          const lng = parseFloat(longitude);
          if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
            finalLatitude = lat;
            finalLongitude = lng;
            console.log(`✅ Using provided coordinates: ${finalLatitude}, ${finalLongitude}`);
          } else {
            console.warn(`⚠️ Invalid coordinates provided: ${latitude}, ${longitude}`);
          }
        }
        
        propertyResult = await client.query(
          `INSERT INTO properties (
            title, description, address, city, state, zip_code, property_type,
            bedrooms, bathrooms, square_feet, year_built, lot_size, price,
            listing_type, available_date, owner_id, agent_id, status, latitude, longitude
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          RETURNING *`,
          [...insertValues, finalLatitude, finalLongitude]
        );
        
        property = propertyResult.rows[0];
        console.log('✅ Successfully inserted property');
      } catch (insertError) {
        console.error('❌ INSERT failed:', insertError.message);
        throw insertError;
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
      
      // Insert photos - support multiple photos per property
      if (photos && Array.isArray(photos) && photos.length > 0) {
        console.log(`📸 Inserting ${photos.length} photos for property ${property.id}`);
        for (let i = 0; i < photos.length; i++) {
          const photo = photos[i];
          const photoUrl = photo.url || photo.photo_url || '';
          const photoName = photo.name || photo.photo_name || `photo_${i + 1}.jpg`;
          const photoSize = photo.size || photo.photo_size || 0;
          
          if (photoUrl) {
            // Validate size (max 5MB base64 = ~6.7MB file)
            const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
            if (photoUrl.length > MAX_BASE64_SIZE) {
              const sizeMB = (photoUrl.length / (1024 * 1024)).toFixed(2);
              console.error(`❌ PHOTO TOO LARGE: Photo ${i + 1} (${photoName}) base64 size: ${sizeMB}MB`);
              throw new Error(`Photo ${i + 1} (${photoName}) is too large (${sizeMB}MB). Maximum size is 5MB. Please compress or resize the image.`);
            }
            
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
            console.log(`✅ Inserted photo ${i + 1}/${photos.length}: ${photoName} (${(photoUrl.length / 1024).toFixed(2)}KB base64)`);
          } else {
            console.warn(`⚠️ Skipping photo ${i + 1} - no URL provided`);
          }
        }
        console.log(`✅ Successfully inserted ${photos.length} photos for property ${property.id}`);
      }
      
      await client.query('COMMIT');
      
      res.status(201).json({
        success: true,
        message: 'Property created successfully',
        data: property
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error creating property:', error);
    
    // Check if it's the VARCHAR(500) length error
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('value too long for type character varying(500)') || 
        errorMessage.includes('character varying(500)')) {
      console.error('❌ DATABASE MIGRATION REQUIRED: photo_url column is still VARCHAR(500)');
      console.error('   Please run: node run-migration.mjs');
      return res.status(500).json({
        success: false,
        message: 'Database migration required',
        error: 'The photo_url column needs to be migrated from VARCHAR(500) to TEXT. Please run the migration script: node run-migration.mjs, then restart the server.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create property',
      error: errorMessage
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
      const updateFields = [];
      const updateValues = [];
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
      
      // Handle latitude and longitude updates
      const latitude = req.body.latitude || req.body.lat || undefined;
      const longitude = req.body.longitude || req.body.lng || req.body.lon || undefined;
      
      if (latitude !== undefined && longitude !== undefined) {
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          updateFields.push(`latitude = $${paramCount++}`);
          updateValues.push(lat);
          updateFields.push(`longitude = $${paramCount++}`);
          updateValues.push(lng);
          console.log(`✅ Updating coordinates: ${lat}, ${lng}`);
        } else {
          console.warn(`⚠️ Invalid coordinates provided for update: ${latitude}, ${longitude}`);
        }
      } else if (latitude !== undefined || longitude !== undefined) {
        console.warn(`⚠️ Only one coordinate provided (lat: ${latitude}, lng: ${longitude}). Both are required.`);
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
          await client.query('DELETE FROM property_features WHERE property_id = $1', [id]);
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
          await client.query('DELETE FROM property_amenities WHERE property_id = $1', [id]);
          if (Array.isArray(amenities) && amenities.length > 0) {
            for (const amenity of amenities) {
              await client.query(
                'INSERT INTO property_amenities (property_id, amenity_name) VALUES ($1, $2)',
                [id, amenity]
              );
            }
          }
        }
        
        // Update photos
        if (photos !== undefined) {
          await client.query('DELETE FROM property_photos WHERE property_id = $1', [id]);
          if (Array.isArray(photos) && photos.length > 0) {
            for (let i = 0; i < photos.length; i++) {
              const photo = photos[i];
              const photoUrl = photo.url || photo.photo_url || '';
              const photoName = photo.name || photo.photo_name || `photo_${i + 1}.jpg`;
              const photoSize = photo.size || photo.photo_size || 0;
              
              // Validate photo size (max 5MB base64)
              if (photoUrl) {
                const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
                if (photoUrl.length > MAX_BASE64_SIZE) {
                  const sizeMB = (photoUrl.length / (1024 * 1024)).toFixed(2);
                  console.error(`❌ PHOTO TOO LARGE: Photo ${i + 1} base64 size: ${sizeMB}MB`);
                  throw new Error(`Photo ${i + 1} is too large (${sizeMB}MB). Maximum size is 5MB. Please compress or resize the image.`);
                }
              }
              
              if (photoUrl) {
                await client.query(
                  `INSERT INTO property_photos (property_id, photo_url, photo_name, photo_size, is_primary, display_order) 
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [id, photoUrl, photoName, photoSize, i === 0, i + 1]
                );
              }
            }
          }
        }
        
        await client.query('COMMIT');
        
        // Fetch updated property with all relations
        const updatedPropertyResult = await client.query('SELECT * FROM properties WHERE id = $1', [id]);
        const photosResult = await client.query('SELECT * FROM property_photos WHERE property_id = $1 ORDER BY display_order', [id]);
        const featuresResult = await client.query('SELECT feature_name FROM property_features WHERE property_id = $1', [id]);
        const amenitiesResult = await client.query('SELECT amenity_name FROM property_amenities WHERE property_id = $1', [id]);
        
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
      
      const propertyCheck = await client.query('SELECT * FROM properties WHERE id = $1', [id]);
      
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
    
    const query = `
      SELECT 
        p.*,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        u.phone as owner_phone,
        u.email as owner_email
      FROM properties p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE u.email = $1 OR p.owner_email = $1
    `;
    
    const result = await pool.query(query, [ownerEmail]);
    
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
        
        return {
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
          ownerName: property.owner_name || (property.owner_first_name ? `${property.owner_first_name} ${property.owner_last_name || ''}`.trim() : '') || '',
          ownerEmail: property.owner_email || property.ownerEmail || '',
          ownerPhone: property.owner_phone || property.ownerPhone || '',
          ownerPreferredContact: property.owner_preferred_contact || property.ownerPreferredContact || 'email',
          submittedAt: property.submitted_at || property.submittedAt || property.created_at || property.createdAt,
          createdAt: property.created_at || property.createdAt,
          updatedAt: property.updated_at || property.updatedAt,
          // Include latitude/longitude for map functionality
          latitude: property.latitude || null,
          longitude: property.longitude || null,
          // Also include as coordinates object for convenience
          coordinates: (property.latitude && property.longitude) ? {
            lat: parseFloat(property.latitude),
            lng: parseFloat(property.longitude)
          } : null
        };
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

