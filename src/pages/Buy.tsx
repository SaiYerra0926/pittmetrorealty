import { useState, useEffect } from "react";
import { Search, MapPin, Home, DollarSign, Bed, Bath, Star, Calendar, Phone, User, Building2, Eye, CheckCircle, FileText, CreditCard, Key, TrendingUp } from "lucide-react";
import PropertyDetailsModal from "@/components/PropertyDetailsModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PropertiesAPI } from "@/lib/api/properties";
import { emailAPI } from "@/lib/api/email";
import { useToast } from "@/hooks/use-toast";

const Buy = () => {
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const propertiesApi = new PropertiesAPI();
  const { toast } = useToast();
  const [buyerInfo, setBuyerInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    budget: "",
    timeline: "",
    propertyType: "",
    bedrooms: "",
    bathrooms: "",
    preferredAreas: "",
    financing: "",
    firstTimeBuyer: false,
    additionalInfo: ""
  });

  useEffect(() => {
    const fetchBuyProperties = async () => {
      try {
        setIsLoading(true);
        // Fetch active properties for sale (listingType: 'sell' shows properties available to buy)
        const response = await propertiesApi.getProperties({ 
          status: 'active',
          listingType: 'sell'
        });
        
        // Map API response to component format
        const mappedProperties = (response.listings || []).map((listing: any) => ({
          id: listing.id,
          price: listing.price ? `$${listing.price.toLocaleString()}` : 'Price on request',
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
      status: "For Sale",
          rating: 4.5,
          agent: listing.agent_first_name && listing.agent_last_name 
            ? `${listing.agent_first_name} ${listing.agent_last_name}`
            : "Pitt Metro Realty",
          agentPhone: listing.agent_phone || "(412) 555-0100",
          agentEmail: listing.agent_email || "info@pittmetro.com",
      owner: {
            name: listing.ownerName || (listing.owner_first_name && listing.owner_last_name 
              ? `${listing.owner_first_name} ${listing.owner_last_name}`
              : 'Property Owner'),
            phone: listing.ownerPhone || listing.owner_phone || '',
            email: listing.ownerEmail || listing.owner_email || '',
            preferredContact: listing.ownerPreferredContact || 'email',
            reasonForSelling: "Contact owner for details",
            timeOwned: "Contact owner for details",
            propertyCondition: "Contact owner for details"
      },
          description: listing.description || '',
          highlights: listing.features?.slice(0, 4) || [],
          propertyTax: "Contact for details",
          hoaFee: "Contact for details",
          utilities: "Contact for details",
          mortgageInfo: "Contact for details",
          specialTerms: "Contact for details",
          photos: listing.photos || [],
          image: listing.photos && listing.photos.length > 0 
            ? (listing.photos[0].url || listing.photos[0].photo_url || '')
            : '',
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
        
        setProperties(mappedProperties);
      } catch (error) {
        console.error('Error fetching buy properties:', error);
        setProperties([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBuyProperties();
  }, []);

  // Helper function to get image source (handles base64 and URLs)
  const getImageSrc = (image: string) => {
    if (!image) return '';
    // Already a data URL (base64 with prefix)
    if (image.startsWith('data:image')) return image;
    // Regular HTTP/HTTPS URL
    if (image.startsWith('http://') || image.startsWith('https://')) return image;
    // Assume it's base64 without prefix, add the prefix
    return `data:image/jpeg;base64,${image}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-18 md:pt-20 pb-6 sm:pb-8 md:pb-10 bg-gradient-to-br from-primary via-primary-light to-primary text-white overflow-hidden safe-top">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')]"></div>
        </div>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-5 md:px-6 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1 sm:py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs sm:text-sm font-semibold mb-3 sm:mb-4 shadow-sm border border-white/20">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
              <span>Find Your Dream Home</span>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3 leading-tight px-2 tracking-tight">
              Discover Your Perfect
              <span className="block bg-gradient-to-r from-yellow-300 via-yellow-200 to-orange-300 bg-clip-text text-transparent mt-1">
                Home Today
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-white/90 mb-4 sm:mb-5 leading-relaxed max-w-xl mx-auto px-3 font-light">
              Explore premium properties in Pittsburgh with expert guidance, 
              transparent pricing, and exceptional service.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 px-2">
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full touch-target border border-white/20 shadow-sm hover:bg-white/20 transition-all duration-200">
                <CheckCircle className="h-3.5 w-3.5 text-green-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Verified Properties</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full touch-target border border-white/20 shadow-sm hover:bg-white/20 transition-all duration-200">
                <Calendar className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Quick Process</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/15 backdrop-blur-md rounded-full touch-target border border-white/20 shadow-sm hover:bg-white/20 transition-all duration-200">
                <User className="h-3.5 w-3.5 text-blue-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Expert Agents</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Buyer Information Section */}
      <section className="py-6 sm:py-8 md:py-10 bg-slate-50/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 w-full">
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-2 sm:mb-3 md:mb-4 px-2">
              Tell Us About Your Home Buying Needs
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
              Help us find the perfect property for you by sharing your preferences and requirements
            </p>
          </div>

          <div className="max-w-3xl mx-auto w-full">
            {/* Buyer Form */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg p-4 sm:p-5 md:p-6">
                <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 sm:gap-3">
                  <User className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 flex-shrink-0" />
                  <span>Buyer Information</span>
                </CardTitle>
                <p className="text-white/90 text-sm sm:text-base md:text-lg mt-2 sm:mt-3">We'll use this information to match you with the best properties</p>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 md:p-6 lg:p-8">
                <form className="space-y-4 sm:space-y-5 md:space-y-6">
                  {/* Personal Information */}
                  <div className="space-y-6">
                    <h3 className="text-sm sm:text-base font-bold text-slate-800 border-b border-slate-200 pb-2">Personal Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <div>
                        <Label htmlFor="firstName" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">First Name *</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          value={buyerInfo.firstName}
                          onChange={(e) => setBuyerInfo({...buyerInfo, firstName: e.target.value})}
                          className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Last Name *</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          value={buyerInfo.lastName}
                          onChange={(e) => setBuyerInfo({...buyerInfo, lastName: e.target.value})}
                          className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <div>
                        <Label htmlFor="email" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          value={buyerInfo.email}
                          onChange={(e) => setBuyerInfo({...buyerInfo, email: e.target.value})}
                          className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="+1-412-977-7090"
                          value={buyerInfo.phone}
                          onChange={(e) => setBuyerInfo({...buyerInfo, phone: e.target.value})}
                          className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Property Preferences */}
                  <div className="space-y-6">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 border-b border-slate-200 pb-2 flex items-center gap-1.5 sm:gap-2">
                      <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                      <span>Property Preferences</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
                      <div>
                        <Label htmlFor="budget" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Budget Range</Label>
                        <Select value={buyerInfo.budget} onValueChange={(value) => setBuyerInfo({...buyerInfo, budget: value})}>
                          <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="under-300k">Under $300K</SelectItem>
                            <SelectItem value="300k-500k">$300K - $500K</SelectItem>
                            <SelectItem value="500k-750k">$500K - $750K</SelectItem>
                            <SelectItem value="750k-1m">$750K - $1M</SelectItem>
                            <SelectItem value="1m-1.5m">$1M - $1.5M</SelectItem>
                            <SelectItem value="over-1.5m">Over $1.5M</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="timeline" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Timeline</Label>
                        <Select value={buyerInfo.timeline} onValueChange={(value) => setBuyerInfo({...buyerInfo, timeline: value})}>
                          <SelectTrigger className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target">
                            <SelectValue placeholder="When do you want to buy?" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediately">Immediately</SelectItem>
                            <SelectItem value="1-3-months">1-3 months</SelectItem>
                            <SelectItem value="3-6-months">3-6 months</SelectItem>
                            <SelectItem value="6-12-months">6-12 months</SelectItem>
                            <SelectItem value="over-1-year">Over 1 year</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="preferredAreas" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Preferred Areas</Label>
                      <Input
                        id="preferredAreas"
                        placeholder="e.g., Shadyside, Squirrel Hill, Mount Lebanon"
                        value={buyerInfo.preferredAreas}
                        onChange={(e) => setBuyerInfo({...buyerInfo, preferredAreas: e.target.value})}
                        className="h-11 sm:h-12 md:h-14 text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target"
                      />
                    </div>

                    <div>
                      <Label htmlFor="additionalInfo" className="text-xs sm:text-sm font-semibold text-slate-700 mb-1.5 sm:mb-2 block">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        placeholder="Tell us about any specific requirements, must-haves, or deal-breakers..."
                        value={buyerInfo.additionalInfo}
                        onChange={(e) => setBuyerInfo({...buyerInfo, additionalInfo: e.target.value})}
                        className="min-h-[100px] sm:min-h-[120px] md:min-h-[140px] text-sm sm:text-base border-2 border-slate-200 focus:border-primary rounded-lg sm:rounded-xl touch-target"
                      />
                    </div>

                    <div className="flex items-center space-x-3">
                      <Checkbox
                        id="firstTimeBuyer"
                        checked={buyerInfo.firstTimeBuyer}
                        onCheckedChange={(checked) => setBuyerInfo({...buyerInfo, firstTimeBuyer: checked as boolean})}
                        className="h-5 w-5"
                      />
                      <Label htmlFor="firstTimeBuyer" className="text-sm text-slate-700 font-medium">
                        I am a first-time home buyer
                      </Label>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    onClick={async (e) => {
                      e.preventDefault();
                      
                      // Basic validation
                      if (!buyerInfo.firstName || !buyerInfo.lastName || !buyerInfo.email || !buyerInfo.phone) {
                        toast({
                          title: "Validation Error",
                          description: "Please fill in all required fields (First Name, Last Name, Email, Phone).",
                          variant: "destructive",
                        });
                        return;
                      }

                      setIsSubmitting(true);
                      
                      try {
                        console.log('Sending buy inquiry email:', buyerInfo);
                        
                        await emailAPI.sendBuyInquiry({
                          firstName: buyerInfo.firstName,
                          lastName: buyerInfo.lastName,
                          email: buyerInfo.email,
                          phone: buyerInfo.phone,
                          budget: buyerInfo.budget || '',
                          timeline: buyerInfo.timeline || '',
                          preferredAreas: buyerInfo.preferredAreas || '',
                          firstTimeBuyer: buyerInfo.firstTimeBuyer,
                          additionalInfo: buyerInfo.additionalInfo || ''
                        });

                        toast({
                          title: "Application Submitted Successfully!",
                          description: "Thank you! Your information has been submitted. We will contact you soon.",
                          variant: "default",
                        });

                        // Reset form
                        setBuyerInfo({
                          firstName: "",
                          lastName: "",
                          email: "",
                          phone: "",
                          budget: "",
                          timeline: "",
                          propertyType: "",
                          bedrooms: "",
                          bathrooms: "",
                          preferredAreas: "",
                          financing: "",
                          firstTimeBuyer: false,
                          additionalInfo: ""
                        });
                      } catch (error: any) {
                        console.error('Error submitting form:', error);
                        toast({
                          title: "Submission Failed",
                          description: error.message || "Failed to submit your information. Please try again or contact us directly.",
                          variant: "destructive",
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    disabled={isSubmitting}
                    className="w-full h-12 text-sm sm:text-base font-semibold bg-primary hover:bg-primary/90 shadow-lg touch-target min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <FileText className="h-5 w-5 mr-2" />
                        Submit Buyer Information
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Properties Grid */}
      <section id="properties" className="py-6 sm:py-8 md:py-10 bg-slate-50/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 w-full">
          <div className="text-center mb-5 sm:mb-6 md:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-800 mb-3 sm:mb-4 md:mb-5 px-2">
              Featured Properties from Owners
            </h2>
            <p className="text-sm sm:text-base md:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed px-4">
              Discover premium properties listed directly by owners across Pittsburgh's most desirable neighborhoods
            </p>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No properties available at the moment.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 items-stretch">
            {properties.map((property) => (
              <Card key={property.id} className="group hover:shadow-2xl transition-all duration-300 overflow-hidden bg-white/90 backdrop-blur-sm border border-slate-200/50 shadow-md hover:-translate-y-1">
                  <div className="relative overflow-hidden">
                    {property.image ? (
                      <img
                        src={getImageSrc(property.image)}
                        alt={property.address}
                        className="w-full h-72 object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) fallback.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-72 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 flex items-center justify-center ${property.image ? 'hidden' : ''}`}>
                      <Home className="h-20 w-20 text-slate-500" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    {/* Listing Type Icon Badge */}
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg backdrop-blur-sm shadow-lg bg-blue-500/95 text-white hover:bg-blue-600/95 transition-all duration-300">
                      <Home className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide">Buy</span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg mb-1">
                        {property.price}
                      </div>
                      <Badge variant="outline" className="bg-white/90 text-slate-700 shadow-sm text-xs sm:text-sm px-2 sm:px-2.5 md:px-3 py-0.5 sm:py-1">
                      {property.type}
                    </Badge>
                  </div>
                </div>
                
                <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-slate-600 font-medium">{property.rating}</span>
                    </div>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-semibold text-slate-800 mb-2 sm:mb-3 group-hover:text-primary transition-colors break-words">
                    {property.address}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-slate-600 mb-4 sm:mb-5 md:mb-6 leading-relaxed line-clamp-3">
                    {property.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-slate-600 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Bed className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{property.bedrooms} beds</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Bath className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{property.bathrooms} baths</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="font-medium">{property.sqft} sqft</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-5 md:mb-6">
                    {property.highlights.slice(0, 2).map((highlight, index) => (
                      <Badge key={index} variant="outline" className="text-[10px] sm:text-xs bg-green-50 text-green-700 border-green-200 px-2 py-0.5 sm:px-2.5 sm:py-1">
                        <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                        {highlight}
                      </Badge>
                    ))}
                    {property.highlights.length > 2 && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs px-2 py-0.5 sm:px-2.5 sm:py-1">
                        +{property.highlights.length - 2} more
                      </Badge>
                    )}
                  </div>

                  {/* Owner Information */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">Property Owner</span>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="font-medium text-slate-700 break-words">{property.owner.name}</div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="break-all">{property.owner.phone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate break-all">{property.owner.email}</span>
                      </div>
                      <div className="text-slate-600 break-words">
                        <span className="font-medium">Reason for selling:</span> {property.owner.reasonForSelling}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium">Owned for:</span> {property.owner.timeOwned}
                      </div>
                      <div className="text-slate-600">
                        <span className="font-medium">Condition:</span> {property.owner.propertyCondition}
                      </div>
                    </div>
                  </div>

                  {/* Agent Information */}
                  <div className="bg-slate-50 rounded-lg p-3 sm:p-4 md:p-5 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                      <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-slate-800">Listing Agent</span>
                    </div>
                    
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div className="font-medium text-slate-700 break-words">{property.agent}</div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        <span className="break-all">{property.agentPhone}</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600">
                        <User className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate break-all">{property.agentEmail}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special Terms */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 md:mb-6">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                      <CreditCard className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-yellow-600 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-semibold text-yellow-800">Special Terms</span>
                    </div>
                    <div className="text-xs sm:text-sm text-yellow-700 space-y-1.5 sm:space-y-2">
                      <div className="break-words"><span className="font-medium">Financing:</span> {property.mortgageInfo}</div>
                      <div className="break-words"><span className="font-medium">Terms:</span> {property.specialTerms}</div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 pt-4 sm:pt-5 md:pt-6 border-t border-slate-200">
                    {property.yearBuilt && (
                    <div className="text-xs sm:text-sm font-medium text-slate-800">
                      Built {property.yearBuilt}
                    </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <Button 
                      onClick={() => {
                        // Handle schedule tour
                        window.location.href = `tel:+14129777090`;
                      }}
                      className="flex-1 bg-primary hover:bg-primary/90 h-12 px-6 py-3 text-sm font-semibold min-h-[48px] touch-target"
                    >
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Schedule Tour</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedProperty(property)}
                      className="flex-1 border-2 border-primary text-primary hover:bg-primary hover:text-white h-12 px-6 py-3 text-sm font-semibold min-h-[48px] touch-target"
                    >
                      <Eye className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>View Details</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 sm:py-10 md:py-12 bg-gradient-to-r from-primary to-primary-light text-white">
        <div className="max-w-3xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 px-2">
            Need Help Finding Your Perfect Home?
          </h2>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/90 mb-4 sm:mb-5 md:mb-6 px-4">
            Our expert team is here to guide you through every step of the home buying process
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => {
                window.location.href = `tel:+14129777090`;
              }}
              className="bg-white text-primary hover:bg-white/90 h-14 sm:h-16 px-8 sm:px-10 py-3 sm:py-4 text-base sm:text-lg md:text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[56px] touch-target"
            >
              <Phone className="h-5 w-5 sm:h-6 sm:w-6 mr-2 flex-shrink-0" />
              Call +1-412-977-7090
            </Button>
          </div>
        </div>
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

export default Buy;