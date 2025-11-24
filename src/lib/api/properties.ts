// Property Listings API Client
interface PropertyListing {
  id?: string;
  // Basic Information
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Property Details
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  yearBuilt?: number;
  lotSize?: number;
  
  // Pricing
  price: number;
  listingType: 'rent' | 'sell' | 'buy'; // 'rent', 'sell', or 'buy'
  
  // Features & Amenities
  features: string[];
  amenities: string[];
  
  // Additional Info
  status: 'Draft' | 'Pending Review' | 'Approved' | 'Rejected' | 'Published';
  availableDate?: string;
  photos: Array<{
    id?: number;
    name: string;
    url: string;
    size?: number;
    file?: File;
  }>;
  
  // Owner Information
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPreferredContact?: 'email' | 'phone' | 'text';
  
  // Metadata
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface PropertyListingsResponse {
  listings: PropertyListing[];
  total: number;
}

interface PropertyListingStats {
  totalListings: number;
  publishedListings: number;
  pendingListings: number;
  approvedListings: number;
}

export class PropertiesAPI {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    // Use environment variable if available, otherwise fallback to localhost for development
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
  }

  /**
   * Test API server connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/api/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async fetchData<T>(endpoint: string, options?: RequestInit, retries: number = 1): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add timeout to prevent hanging requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let errorData: any;
          try {
            const text = await response.text();
            console.error(`API Error Response (${response.status}) raw text:`, text);
            try {
              errorData = JSON.parse(text);
            } catch (parseError) {
              // If JSON parsing fails, use the raw text as the error message
              errorData = { message: text || `API error: ${response.statusText} (${response.status})` };
            }
          } catch (e) {
            errorData = { message: `API error: ${response.statusText} (${response.status})` };
          }
          
          // Extract error message from API response - prioritize error field (contains actual DB error), then message
          // The error field usually contains the actual database error, while message might be generic
          const errorMessage = errorData.error || errorData.message || errorData.detailedError || `API error: ${response.statusText} (${response.status})`;
          
          // Include additional details if available
          let fullErrorMessage = errorMessage;
          if (errorData.details && process.env.NODE_ENV === 'development') {
            fullErrorMessage += `\n\nDetails: ${errorData.details}`;
          }
          
          console.error(`API Error Response (${response.status}):`, errorData);
          console.error(`Extracted error message:`, errorMessage);
          throw new Error(fullErrorMessage);
        }

        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        // Handle abort/timeout
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error(`Request timeout: The API server at ${this.baseUrl} did not respond within 30 seconds. Please check if the server is running and accessible.`);
        }
        
        // Handle network errors (e.g., server not running, CORS, connection refused)
        if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch'))) {
          console.error(`Network error fetching from ${url} (attempt ${attempt + 1}/${retries + 1}):`, error.message);
          
          // If this is the last attempt, provide detailed error message
          if (attempt === retries) {
            const isLocalhost = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
            const isProduction = this.baseUrl.includes('3.12.102.126') || this.baseUrl.includes('pittmetrorealty.com');
            
            let errorMessage = `Unable to connect to API server at ${this.baseUrl}. `;
            
            if (isLocalhost) {
              errorMessage += `Please ensure the server is running with "npm run server" or "npm start".`;
            } else if (isProduction) {
              errorMessage += `Possible causes:\n1. Server may be down - check if the server is running\n2. Firewall/Security Group may be blocking port 3001\n3. CORS configuration may need updating\n4. Network connectivity issues\n\nPlease contact the administrator or check server status.`;
            } else {
              errorMessage += `Please check your network connection and ensure the server is running.`;
            }
            
            throw new Error(errorMessage);
          }
          
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          continue;
        }
        
        // Re-throw if it's already an Error with a message (non-network errors)
        if (error instanceof Error) {
          throw error;
        }
        
        // If we get here, it's an unexpected error
        console.error(`Unexpected error fetching from ${url}:`, error);
        throw new Error(`An unexpected error occurred: ${String(error)}`);
      }
    }
    
    // This should never be reached, but TypeScript needs it
    throw lastError || new Error('Unknown error occurred');
  }

  /**
   * Get all property listings (with optional filters)
   */
  async getProperties(filters?: {
    status?: string;
    listingType?: 'rent' | 'sell' | 'buy';
    ownerEmail?: string;
    limit?: number;
    offset?: number;
  }): Promise<PropertyListingsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.listingType) queryParams.append('listingType', filters.listingType);
      if (filters?.ownerEmail) queryParams.append('ownerEmail', filters.ownerEmail);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const endpoint = `/properties${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const data = await this.fetchData<{ success: boolean; listings: PropertyListing[]; total: number } | PropertyListingsResponse>(endpoint);
      
      // Normalize response format
      const normalizedData = 'listings' in data ? data : { listings: (data as any).data || [], total: (data as any).count || (data as any).total || 0 };
      
      // Cache to localStorage
      localStorage.setItem('properties', JSON.stringify(normalizedData.listings));
      return normalizedData;
    } catch (error) {
      console.warn("Failed to fetch properties from API, attempting to load from localStorage.");
      const localProperties = localStorage.getItem('properties');
      if (localProperties) {
        return { listings: JSON.parse(localProperties), total: JSON.parse(localProperties).length };
      }
      throw error;
    }
  }

  /**
   * Get a single property by ID
   */
  async getProperty(id: string): Promise<PropertyListing> {
    try {
      const data = await this.fetchData<{ listing: PropertyListing }>(`/properties/${id}`);
      return data.listing;
    } catch (error) {
      console.warn("Failed to fetch property from API, attempting to load from localStorage.");
      const localProperties = localStorage.getItem('properties');
      if (localProperties) {
        const properties = JSON.parse(localProperties);
        const property = properties.find((p: PropertyListing) => p.id === id);
        if (property) return property;
      }
      throw error;
    }
  }

  /**
   * Create a new property listing
   */
  async createProperty(listingData: Omit<PropertyListing, 'id' | 'submittedAt' | 'createdAt' | 'updatedAt'>): Promise<PropertyListing> {
    try {
      // Convert File objects to base64 for API submission
      const processedData = {
        ...listingData,
        photos: await Promise.all(
          listingData.photos.map(async (photo, index) => {
            if (photo.file) {
              // Validate file size before conversion (max 5MB file = ~6.7MB base64)
              // Database column is now TEXT, so we can store larger images
              const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
              if (photo.file.size > MAX_FILE_SIZE) {
                const fileSizeMB = (photo.file.size / (1024 * 1024)).toFixed(2);
                throw new Error(`Photo ${index + 1} (${photo.name || 'unnamed'}) is too large (${fileSizeMB}MB). Maximum file size is 5MB. Please compress or resize the image before uploading.`);
              }
              
              // Convert file to base64
              const base64 = await this.fileToBase64(photo.file);
              
              // Double-check base64 length (max 5MB = ~5,242,880 characters)
              const MAX_BASE64_SIZE = 5 * 1024 * 1024; // 5MB
              if (base64.length > MAX_BASE64_SIZE) {
                const base64SizeMB = (base64.length / (1024 * 1024)).toFixed(2);
                throw new Error(`Photo ${index + 1} (${photo.name || 'unnamed'}) base64 string is too large (${base64SizeMB}MB, ${base64.length.toLocaleString()} characters). Maximum is 5MB. Please use a smaller image.`);
              }
              
              return {
                name: photo.name,
                url: base64,
                size: photo.size,
                isBase64: true,
              };
            }
            return photo;
          })
        ),
      };

      const options: RequestInit = {
        method: 'POST',
        body: JSON.stringify(processedData),
      };

      console.log('📤 Submitting property data:', {
        listingType: processedData.listingType,
        title: processedData.title,
        address: processedData.address,
        city: processedData.city,
        state: processedData.state,
        zipCode: processedData.zipCode,
        zip_code: (processedData as any).zip_code,
        price: processedData.price,
        photosCount: processedData.photos.length
      });
      
      // Ensure zipCode is included in the request
      if (!processedData.zipCode && !(processedData as any).zip_code) {
        console.error('❌ WARNING: zipCode is missing from request data!');
        console.error('Full processedData:', JSON.stringify(processedData, null, 2));
      }

      const result = await this.fetchData<{ success: boolean; message: string; listing: PropertyListing }>('/properties', options);
      
      // Invalidate cache after creating a new listing
      localStorage.removeItem('properties');
      localStorage.removeItem('propertyStats');
      localStorage.removeItem('owner_listings');
      
      // Normalize the listing data
      const listing = result.listing || result as any;
      return {
        ...listing,
        photos: Array.isArray(listing.photos) ? listing.photos : [],
        features: Array.isArray(listing.features) ? listing.features : [],
        amenities: Array.isArray(listing.amenities) ? listing.amenities : []
      };
    } catch (error) {
      console.error("Failed to create property:", error);
      console.error("Error type:", typeof error);
      console.error("Error instanceof Error:", error instanceof Error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      // Don't enhance the error message - let the API's actual error message come through
      throw error;
    }
  }

  /**
   * Update an existing property listing
   */
  async updateProperty(id: string, listingData: Partial<PropertyListing>): Promise<PropertyListing> {
    try {
      const options: RequestInit = {
        method: 'PUT',
        body: JSON.stringify(listingData),
      };

      const result = await this.fetchData<{ success: boolean; message: string; data: PropertyListing }>(`/properties/${id}`, options);
      
      // Invalidate cache
      localStorage.removeItem('properties');
      localStorage.removeItem('propertyStats');
      localStorage.removeItem('owner_listings');
      
      // Normalize the listing data
      const listing = result.data || result as any;
      return {
        ...listing,
        photos: Array.isArray(listing.photos) ? listing.photos.map((p: any) => ({
          id: p.id,
          name: p.name || p.photo_name || '',
          url: p.url || p.photo_url || '',
          size: p.size || p.photo_size || 0
        })) : [],
        features: Array.isArray(listing.features) ? listing.features : [],
        amenities: Array.isArray(listing.amenities) ? listing.amenities : []
      };
    } catch (error) {
      console.error("Failed to update property:", error);
      throw error;
    }
  }

  /**
   * Delete a property listing
   */
  async deleteProperty(id: string): Promise<void> {
    try {
      const options: RequestInit = {
        method: 'DELETE',
      };

      await this.fetchData<{ success: boolean; message: string }>(`/properties/${id}`, options);
      
      // Invalidate cache
      localStorage.removeItem('properties');
      localStorage.removeItem('propertyStats');
      localStorage.removeItem('owner_listings');
    } catch (error) {
      console.error("Failed to delete property:", error);
      throw error;
    }
  }

  /**
   * Get property listing statistics
   */
  async getPropertyStats(ownerEmail?: string): Promise<PropertyListingStats> {
    try {
      const endpoint = ownerEmail ? `/properties/stats?ownerEmail=${ownerEmail}` : '/properties/stats';
      const data = await this.fetchData<PropertyListingStats>(endpoint);
      localStorage.setItem('propertyStats', JSON.stringify(data));
      return data;
    } catch (error) {
      console.warn("Failed to fetch property stats from API, attempting to load from localStorage.");
      const localStats = localStorage.getItem('propertyStats');
      if (localStats) {
        return JSON.parse(localStats);
      }
      // Return default stats if nothing is cached
      return {
        totalListings: 0,
        publishedListings: 0,
        pendingListings: 0,
        approvedListings: 0,
      };
    }
  }

  /**
   * Get properties by owner email
   */
  async getPropertiesByOwner(ownerEmail: string): Promise<PropertyListingsResponse> {
    try {
      const endpoint = `/properties/owner?ownerEmail=${encodeURIComponent(ownerEmail)}`;
      const data = await this.fetchData<{ success: boolean; listings: PropertyListing[]; total: number }>(endpoint);
      
      // Cache to localStorage
      if (data.listings && data.listings.length > 0) {
        localStorage.setItem('owner_listings', JSON.stringify(data.listings));
      }
      
      return { listings: data.listings || [], total: data.total || 0 };
    } catch (error) {
      console.warn("Failed to fetch properties by owner from API, attempting to load from localStorage.");
      const localProperties = localStorage.getItem('owner_listings');
      if (localProperties) {
        const parsed = JSON.parse(localProperties);
        return { listings: Array.isArray(parsed) ? parsed : [], total: Array.isArray(parsed) ? parsed.length : 0 };
      }
      throw error;
    }
  }

  /**
   * Get published properties (for public display)
   */
  async getPublishedProperties(listingType?: 'rent' | 'sell' | 'buy'): Promise<PropertyListingsResponse> {
    return this.getProperties({ status: 'Published', listingType });
  }

  /**
   * Helper method to convert File to base64
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }

  /**
   * Helper method to convert base64 to File (for retrieval)
   */
  base64ToFile(base64: string, filename: string, mimeType: string = 'image/jpeg'): File {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
}

export type { PropertyListing, PropertyListingsResponse, PropertyListingStats };

