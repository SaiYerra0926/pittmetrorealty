import { useState, useEffect } from "react";
import { Search, MapPin, Home, DollarSign, Bed, Bath, Calendar, Star, Phone, Mail, Filter, Clock, Users, Shield, Wifi, Key, TrendingUp, Eye } from "lucide-react";
import PropertyDetailsModal from "@/components/PropertyDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { PropertiesAPI } from "@/lib/api/properties";

const Rent = () => {
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [searchFilters, setSearchFilters] = useState({
    location: "",
    city: "",
    state: "",
    zipCode: "",
    priceMin: "",
    priceMax: "",
    bedrooms: "",
    bathrooms: "",
    propertyType: "",
    leaseLength: ""
  });
  const [filteredProperties, setFilteredProperties] = useState<any[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [rentalProperties, setRentalProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const propertiesApi = new PropertiesAPI();

  useEffect(() => {
    const fetchRentalProperties = async () => {
      try {
        setIsLoading(true);
        // Fetch active rental properties
        const response = await propertiesApi.getProperties({ 
          status: 'active',
          listingType: 'rent'
        });
        
        // Map API response to component format
        const mappedProperties = (response.listings || []).map((listing: any) => ({
          id: listing.id,
          image: listing.photos && listing.photos.length > 0 
            ? (listing.photos[0].url || listing.photos[0].photo_url || '')
            : '',
          price: listing.price ? `$${listing.price.toLocaleString()}` : 'Price on request',
          period: "/month",
          address: listing.address || '',
          city: listing.city || '',
          state: listing.state || '',
          zipCode: listing.zipCode || listing.zip_code || '',
          bedrooms: listing.bedrooms || 0,
          bathrooms: listing.bathrooms || 0,
          sqft: listing.squareFeet ? listing.squareFeet.toLocaleString() : '0',
          type: listing.propertyType || '',
          yearBuilt: listing.yearBuilt || null,
          features: listing.features || [],
          amenities: listing.amenities || [],
          status: "Available",
          availableDate: listing.availableDate || '',
          leaseLength: "12 months",
          rating: 4.5,
          agent: "Pitt Metro Realty",
          deposit: listing.price ? `$${Math.round(listing.price * 0.1).toLocaleString()}` : '$0',
          description: listing.description || '',
          photos: listing.photos || [],
          images: listing.photos && listing.photos.length > 0
            ? listing.photos.map((p: any) => p.url || p.photo_url || '').filter(Boolean)
            : [],
          // Include coordinates for map display
          latitude: listing.latitude || listing.coordinates?.lat,
          longitude: listing.longitude || listing.coordinates?.lng,
          coordinates: listing.latitude && listing.longitude 
            ? { lat: listing.latitude, lng: listing.longitude }
            : listing.coordinates
        }));
        
        setRentalProperties(mappedProperties);
      } catch (error) {
        console.error('Error fetching rental properties:', error);
        setRentalProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentalProperties();
  }, []);

  // Helper function to get image source (handles base64 and URLs)
  const getImageSrc = (image: string) => {
    if (!image) return '';
    if (image.startsWith('data:image')) return image;
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    return `data:image/jpeg;base64,${image}`;
  };

  // Static rental properties removed - now fetching from API

  // Helper function to perform search with given filters
  const performSearch = (filters = searchFilters) => {
    // Filter properties based on search criteria
    let filtered = [...rentalProperties];

    // Filter by location - search in address, city, state, and ZIP code
    if (searchFilters.location.trim() || searchFilters.city || searchFilters.state || searchFilters.zipCode) {
      const locationLower = (searchFilters.location || '').toLowerCase().trim();
      const cityLower = (searchFilters.city || '').toLowerCase().trim();
      const stateLower = (searchFilters.state || '').toLowerCase().trim();
      const zipCodeLower = (searchFilters.zipCode || '').toLowerCase().trim();
      
      filtered = filtered.filter(property => {
        const propertyAddress = (property.address || '').toLowerCase();
        const propertyCity = (property.city || '').toLowerCase();
        const propertyState = (property.state || '').toLowerCase();
        const propertyZipCode = (property.zipCode || '').toLowerCase();
        
        // If specific city, state, or ZIP is provided, match those (case-insensitive partial match)
        if (cityLower && !propertyCity.includes(cityLower) && !cityLower.includes(propertyCity)) return false;
        if (stateLower && !propertyState.includes(stateLower) && !stateLower.includes(propertyState)) return false;
        if (zipCodeLower && propertyZipCode !== zipCodeLower) return false;
        
        // If general location search is provided, search in address, city, state, or ZIP
        if (locationLower) {
          return propertyAddress.includes(locationLower) || 
                 propertyCity.includes(locationLower) ||
                 propertyState.includes(locationLower) ||
                 propertyZipCode.includes(locationLower) ||
                 locationLower.includes(propertyCity) ||
                 locationLower.includes(propertyState);
        }
        
        // If only city/state/zip filters are set, return true if they match
        return true;
      });
    }

    // Filter by price range
    if (searchFilters.priceMin) {
      const minPrice = parseInt(searchFilters.priceMin);
      filtered = filtered.filter(property => {
        const propertyPrice = parseInt(property.price.replace(/[^0-9]/g, ''));
        return propertyPrice >= minPrice;
      });
    }
    if (searchFilters.priceMax) {
      const maxPrice = parseInt(searchFilters.priceMax);
      filtered = filtered.filter(property => {
        const propertyPrice = parseInt(property.price.replace(/[^0-9]/g, ''));
        return propertyPrice <= maxPrice;
      });
    }

    // Filter by bedrooms
    if (searchFilters.bedrooms && searchFilters.bedrooms !== 'any') {
      const beds = searchFilters.bedrooms === 'studio' ? 0 : parseInt(searchFilters.bedrooms);
      filtered = filtered.filter(property => {
        if (searchFilters.bedrooms === 'studio') return property.bedrooms === 0;
        return property.bedrooms >= beds;
      });
    }

    // Filter by bathrooms
    if (searchFilters.bathrooms && searchFilters.bathrooms !== 'any') {
      const baths = parseFloat(searchFilters.bathrooms);
      filtered = filtered.filter(property => property.bathrooms >= baths);
    }

    // Filter by property type
    if (searchFilters.propertyType && searchFilters.propertyType !== 'any') {
      filtered = filtered.filter(property => {
        const type = property.type.toLowerCase();
        const filterType = searchFilters.propertyType.toLowerCase();
        if (filterType === 'house') return type.includes('single family') || type.includes('house');
        if (filterType === 'studio') return property.bedrooms === 0;
        return type.includes(filterType);
      });
    }

    // Filter by lease length
    if (searchFilters.leaseLength && searchFilters.leaseLength !== 'any') {
      const leaseMonths = parseInt(searchFilters.leaseLength);
      filtered = filtered.filter(property => {
        if (searchFilters.leaseLength === 'flexible') return true;
        const propertyLease = parseInt(property.leaseLength.replace(/[^0-9]/g, ''));
        return propertyLease >= leaseMonths;
      });
    }

    // Update filtered properties and activate search
    setFilteredProperties(filtered);
    setIsSearchActive(true);

    // Scroll to properties section
    setTimeout(() => {
      const propertiesSection = document.getElementById('properties');
      if (propertiesSection) {
        propertiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSearch = () => {
    performSearch();
  };

  // Clear search and show all properties
  const handleClearSearch = () => {
    setSearchFilters({
      location: "",
      city: "",
      state: "",
      zipCode: "",
      priceMin: "",
      priceMax: "",
      bedrooms: "",
      bathrooms: "",
      propertyType: "",
      leaseLength: ""
    });
    setFilteredProperties([]);
    setIsSearchActive(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-14 md:pb-16 bg-gradient-to-br from-primary via-primary-light to-primary text-white overflow-hidden safe-top">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Trusted by 10,000+ Pittsburgh Renters
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight px-2">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Rental Home
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-white/90 mb-5 sm:mb-6 md:mb-7 leading-relaxed max-w-2xl mx-auto px-3 sm:px-4">
              Discover premium rental properties in Pittsburgh with flexible lease terms, 
              exceptional amenities, and transparent pricing.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Flexible Leases</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-green-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Pet Friendly</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Modern Amenities</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-16 left-8 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-16 right-8 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-blue-300/10 rounded-full blur-xl"></div>
      </section>

      {/* Search Section */}
      <section className="py-8 sm:py-10 md:py-12 -mt-6 sm:-mt-8 md:-mt-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <Card className="shadow-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-xs sm:text-sm font-medium text-primary mb-3 sm:mb-4 md:mb-5">
                  <Search className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span>Advanced Search</span>
                </div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2 sm:mb-3 px-2">
                  Find Your Dream Rental
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-2xl mx-auto px-3">
                  Use our comprehensive search tools to find the perfect rental property that matches your lifestyle and budget
                </p>
              </div>

              <div className="space-y-4 sm:space-y-5 md:space-y-6">
                {/* Main Search */}
                <div className="relative">
                  <div className="relative">
                    <MapPin className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-gray-400 z-10 pointer-events-none" />
                    <AddressAutocomplete
                      id="rent-search-location"
                      value={searchFilters.location}
                      onChange={(value) => setSearchFilters({...searchFilters, location: value})}
                      onPlaceSelect={(place) => {
                        // Update search filters with selected place details
                        const updatedFilters = {
                          ...searchFilters,
                          location: place.formattedAddress || place.address || place.city || searchFilters.location,
                          city: place.city || '',
                          state: place.state || '',
                          zipCode: place.zipCode || ''
                        };
                        setSearchFilters(updatedFilters);
                        console.log('📍 Place selected for search:', place);
                        
                        // Automatically trigger search with updated filters
                        setTimeout(() => {
                          performSearch(updatedFilters);
                        }, 100);
                      }}
                      placeholder="Enter city, neighborhood, or ZIP code"
                      className="pl-10 sm:pl-12 md:pl-14 pr-24 sm:pr-28 md:pr-32 h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl shadow-sm touch-target min-h-[48px]"
                      types={['geocode', 'address', '(cities)']}
                      componentRestrictions={{ country: 'us' }}
                    />
                    <Button 
                      size="lg" 
                      onClick={() => {
                        handleSearch();
                      }}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-9 sm:h-10 md:h-12 px-4 sm:px-5 md:px-6 text-xs sm:text-sm md:text-base bg-primary hover:bg-primary/90 rounded-lg sm:rounded-xl touch-target min-h-[40px] sm:min-h-[44px] z-10"
                    >
                      <Search className="h-3 w-3 sm:h-4 sm:w-4 md:mr-2 flex-shrink-0" />
                      <span className="hidden sm:inline">Search</span>
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-2.5 sm:gap-3">
                  <Select value={searchFilters.priceMin} onValueChange={(value) => setSearchFilters({...searchFilters, priceMin: value})}>
                    <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Min Rent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Any</SelectItem>
                      <SelectItem value="1000">$1,000</SelectItem>
                      <SelectItem value="1500">$1,500</SelectItem>
                      <SelectItem value="2000">$2,000</SelectItem>
                      <SelectItem value="2500">$2,500</SelectItem>
                      <SelectItem value="3000">$3,000</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.priceMax} onValueChange={(value) => setSearchFilters({...searchFilters, priceMax: value})}>
                    <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Max Rent" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1500">$1,500</SelectItem>
                      <SelectItem value="2000">$2,000</SelectItem>
                      <SelectItem value="2500">$2,500</SelectItem>
                      <SelectItem value="3000">$3,000</SelectItem>
                      <SelectItem value="4000">$4,000</SelectItem>
                      <SelectItem value="5000">$5,000+</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.bedrooms} onValueChange={(value) => setSearchFilters({...searchFilters, bedrooms: value})}>
                    <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                      <Bed className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Bedrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="1">1 Bedroom</SelectItem>
                      <SelectItem value="2">2 Bedrooms</SelectItem>
                      <SelectItem value="3">3 Bedrooms</SelectItem>
                      <SelectItem value="4">4+ Bedrooms</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.bathrooms} onValueChange={(value) => setSearchFilters({...searchFilters, bathrooms: value})}>
                    <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                      <Bath className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Bathrooms" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="1">1 Bathroom</SelectItem>
                      <SelectItem value="1.5">1.5 Bathrooms</SelectItem>
                      <SelectItem value="2">2 Bathrooms</SelectItem>
                      <SelectItem value="3">3+ Bathrooms</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.propertyType} onValueChange={(value) => setSearchFilters({...searchFilters, propertyType: value})}>
                    <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                      <Home className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Property Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="apartment">Apartment</SelectItem>
                      <SelectItem value="studio">Studio</SelectItem>
                      <SelectItem value="townhouse">Townhouse</SelectItem>
                      <SelectItem value="house">Single Family</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={searchFilters.leaseLength} onValueChange={(value) => setSearchFilters({...searchFilters, leaseLength: value})}>
                    <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 text-gray-400 mr-2 flex-shrink-0" />
                      <SelectValue placeholder="Lease Length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      <SelectItem value="6">6 Months</SelectItem>
                      <SelectItem value="12">12 Months</SelectItem>
                      <SelectItem value="24">24 Months</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button 
                    variant="outline" 
                    onClick={() => {
                      // Handle more filters - could open advanced filters dialog
                      console.log('More filters clicked');
                    }}
                    className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-gray-200 hover:border-primary rounded-lg sm:rounded-xl touch-target min-h-[48px]"
                  >
                    <Filter className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5 mr-2 flex-shrink-0" />
                    <span className="hidden sm:inline">More Filters</span>
                    <span className="sm:hidden">Filters</span>
                  </Button>
                </div>

                {/* Results */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6 border-t border-gray-100">
                  <div className="text-slate-600 font-medium">
                    {isSearchActive 
                      ? `Showing ${filteredProperties.length} of ${rentalProperties.length} rental properties`
                      : `Showing ${rentalProperties.length} rental properties`
                    }
                  </div>
                  {isSearchActive && (
                    <Button
                      onClick={handleClearSearch}
                      variant="outline"
                      className="border-2 border-primary text-primary hover:bg-primary hover:text-white min-h-[44px] touch-target text-sm"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <div className="text-sm text-slate-500 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Updated daily with new listings
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Rental Properties Grid */}
      <section id="properties" className="py-10 sm:py-12 md:py-16 bg-slate-50/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-primary/10 rounded-full text-xs sm:text-sm font-medium text-primary mb-4 sm:mb-5 md:mb-6">
              <Home className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Featured Rentals</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-3 sm:mb-4 md:mb-5 px-2">
              Available Properties
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl mx-auto leading-relaxed px-3">
              Discover our carefully curated selection of premium rental properties across Pittsburgh
            </p>
          </div>

          {/* Search Results Info */}
          {isSearchActive && filteredProperties.length === 0 && (
            <div className="mb-8 p-6 bg-yellow-50 border-2 border-yellow-200 rounded-xl text-center">
              <p className="text-base sm:text-lg font-semibold text-yellow-800 mb-2">No properties found</p>
              <p className="text-sm text-yellow-700 mb-4">Try adjusting your search filters to see more results.</p>
              <Button
                onClick={handleClearSearch}
                variant="outline"
                className="border-2 border-yellow-400 text-yellow-800 hover:bg-yellow-100 min-h-[44px] touch-target"
              >
                Clear All Filters
              </Button>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading rental properties...</p>
            </div>
          ) : (isSearchActive ? filteredProperties : rentalProperties).length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No rental properties available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
              {(isSearchActive ? filteredProperties : rentalProperties).map((property) => (
              <Card key={property.id} className="group hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-md hover:-translate-y-1">
                <div className="relative overflow-hidden">
                  {property.image ? (
                    <img
                      src={getImageSrc(property.image)}
                      alt={property.address}
                      className="w-full h-72 object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-72 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center ${property.image ? 'hidden' : ''}`}>
                    <Home className="h-20 w-20 text-slate-500" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                  {/* Listing Type Icon Badge */}
                  <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg bg-green-500/95 text-white hover:bg-green-600/95 transition-all duration-300">
                    <Key className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-semibold uppercase tracking-wide">Rent</span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                      {property.price}
                      <span className="text-sm sm:text-base font-normal text-white/80">{property.period}</span>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium text-slate-600">{property.rating}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {property.type}
                    </Badge>
                  </div>
                  
                  <h3 className="text-base sm:text-lg md:text-xl font-semibold text-slate-800 mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {property.address}
                  </h3>
                  
                  <div className="flex items-center gap-6 text-sm text-slate-600 mb-6">
                    <div className="flex items-center gap-2">
                      <Bed className="h-4 w-4" />
                      <span className="font-medium">{property.bedrooms} bed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Bath className="h-4 w-4" />
                      <span className="font-medium">{property.bathrooms} bath</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      <span className="font-medium">{property.sqft} sqft</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {property.features.slice(0, 3).map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                        {feature}
                      </Badge>
                    ))}
                    {property.features.length > 3 && (
                      <Badge variant="secondary" className="text-xs px-2 py-1">
                        +{property.features.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3 mb-6 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Available:</span>
                      <span className="font-semibold text-slate-800">{property.availableDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Lease:</span>
                      <span className="font-semibold text-slate-800">{property.leaseLength}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Deposit:</span>
                      <span className="font-semibold text-slate-800">{property.deposit}</span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => {
                        window.location.href = `tel:+14129777090`;
                      }}
                      className="flex-1 bg-primary hover:bg-primary/90 h-12 px-6 py-3 text-sm font-semibold min-h-[48px] touch-target"
                    >
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      Schedule Tour
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedProperty(property)}
                      className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white h-12 px-6 py-3 text-sm font-semibold min-h-[48px] touch-target"
                    >
                      <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                      View Details
                    </Button>
                  </div>
                  
                  <div className="text-xs text-slate-500 mt-4 pt-4 border-t border-gray-100">
                    Listed by {property.agent}
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {!isLoading && (isSearchActive ? filteredProperties : rentalProperties).length > 0 && (
          <div className="text-center mt-16">
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => {
                // Handle load more - could load more properties
                console.log('Load more rentals');
                // Scroll to top of properties section
                const propertiesSection = document.getElementById('properties');
                if (propertiesSection) {
                  propertiesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="px-8 py-4 text-sm sm:text-base md:text-lg font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-white touch-target"
            >
              Load More Rentals
            </Button>
          </div>
          )}
        </div>
      </section>


      {/* CTA Section */}
      <section className="relative py-12 sm:py-16 md:py-20 bg-gradient-to-br from-primary via-primary-light to-primary text-white overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full text-xs sm:text-sm font-medium mb-4 sm:mb-5 md:mb-6">
            <Phone className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Ready to Get Started?</span>
          </div>
          
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight px-2">
            Ready to Find Your
            <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Next Home?
            </span>
          </h2>
          
          <p className="text-xs sm:text-sm md:text-base text-white/90 mb-5 sm:mb-6 md:mb-7 leading-relaxed max-w-2xl mx-auto px-3 sm:px-4">
            Our experienced team is here to help you find the perfect rental property 
            that fits your lifestyle and budget.
          </p>
          
          <div className="mb-8 flex justify-center">
            <Button 
              size="lg" 
              onClick={() => {
                window.location.href = `tel:+14129777090`;
              }}
              className="bg-white text-primary hover:bg-white/90 h-14 px-10 py-3.5 text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 min-h-[56px] touch-target"
            >
              <Phone className="h-5 w-5 mr-2" />
              Call +1-412-977-7090
            </Button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-300" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">24/7 Support</h3>
              <p className="text-white/80 text-[10px] sm:text-xs">Round-the-clock assistance for all your rental needs</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-300" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Verified Properties</h3>
              <p className="text-white/80 text-[10px] sm:text-xs">All listings are verified and meet our quality standards</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-300" />
              </div>
              <h3 className="text-xs sm:text-sm font-semibold mb-1 sm:mb-2">Expert Guidance</h3>
              <p className="text-white/80 text-[10px] sm:text-xs">Professional agents to guide you through the process</p>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-6 left-6 w-12 h-12 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-6 right-6 w-16 h-16 bg-yellow-300/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-blue-300/10 rounded-full blur-xl"></div>
      </section>

      {/* Property Details Modal */}
      <PropertyDetailsModal
        property={selectedProperty}
        open={!!selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    </div>
  );
};

export default Rent;
