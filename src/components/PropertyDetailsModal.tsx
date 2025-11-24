import { useState, useEffect } from "react";
import { X, MapPin, Bed, Bath, Car, Square, Star, Calendar, Phone, Mail, Home, Building2, DollarSign, Clock, TrendingUp, ChevronLeft, ChevronRight, Heart, Share2, CheckCircle, Key } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import PropertyLocationMap from '@/components/PropertyLocationMap';

interface Property {
  id: number | string;
  image?: string;
  images?: string[];
  price: string;
  address: string;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: string | number;
  type?: string;
  yearBuilt?: number;
  features?: string[];
  amenities?: string[];
  status?: string;
  daysOnMarket?: number;
  rating?: number;
  agent?: string;
  agentPhone?: string;
  agentEmail?: string;
  description?: string;
  highlights?: string[];
  propertyTax?: string;
  hoaFee?: string;
  utilities?: string;
  mortgageInfo?: string;
  specialTerms?: string;
  owner?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  listingType?: 'buy' | 'rent' | 'sell';
  period?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
  [key: string]: any;
}

interface PropertyDetailsModalProps {
  property: Property | null;
  open: boolean;
  onClose: () => void;
}

const PropertyDetailsModal = ({ property, open, onClose }: PropertyDetailsModalProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (property && open) {
      setCurrentImageIndex(0);
      setIsFavorite(false);
    }
  }, [property, open]);

  if (!property) return null;

  // Support multiple photo formats: property.images, property.photos, or property.image
  const images = property.images || 
    (property.photos && property.photos.length > 0 
      ? property.photos.map((p: any) => p.url || p.photo_url || '').filter(Boolean)
      : []) ||
    (property.image ? [property.image] : []);
  const hasMultipleImages = images.length > 1;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  const getListingTypeBadge = () => {
    if (property.listingType === 'buy') {
      return <Badge className="bg-blue-500 text-white text-xs px-2 py-0.5"><Home className="w-3 h-3 mr-1" />Buy</Badge>;
    } else if (property.listingType === 'rent') {
      return <Badge className="bg-green-500 text-white text-xs px-2 py-0.5"><Key className="w-3 h-3 mr-1" />Rent</Badge>;
    } else if (property.listingType === 'sell') {
      return <Badge className="bg-primary text-white text-xs px-2 py-0.5"><TrendingUp className="w-3 h-3 mr-1" />Sell</Badge>;
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[90vh] max-h-[90vh] overflow-hidden p-0 gap-0 bg-white rounded-2xl shadow-2xl border-none">
        {/* Fixed Header - Compact */}
        <div className="absolute top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-primary truncate leading-tight">
                {property.price}
                {property.period && <span className="text-sm font-normal text-slate-600 ml-1">{property.period}</span>}
              </h1>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-600 mt-0.5">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{property.address}</span>
              </div>
            </div>
            {property.type && (
              <Badge className="bg-primary text-white px-2 py-1 text-xs font-semibold hidden sm:flex whitespace-nowrap">
                {property.type}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`h-8 w-8 rounded-full ${isFavorite ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: property.address,
                    text: `Check out this property: ${property.price}`,
                    url: window.location.href,
                  });
                }
              }}
              className="h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col sm:flex-row h-full pt-[70px] overflow-hidden">
          {/* Left: Image Gallery - Reduced Height */}
          <div className="relative w-full sm:w-2/5 h-[200px] sm:h-[calc(90vh-70px)] bg-gradient-to-br from-slate-200 to-slate-300 flex-shrink-0">
            {images.length > 0 ? (
              <>
                <LazyLoadImage
                  src={(() => {
                    const img = images[currentImageIndex];
                    if (!img) return '';
                    // Already a data URL (base64 with prefix)
                    if (img.startsWith('data:image')) return img;
                    // Regular HTTP/HTTPS URL
                    if (img.startsWith('http://') || img.startsWith('https://')) return img;
                    // Assume it's base64 without prefix, add the prefix
                    return `data:image/jpeg;base64,${img}`;
                  })()}
                  alt={property.address}
                  effect="blur"
                  className="w-full h-full object-cover"
                  placeholderSrc="/placeholder.svg"
                />
                {/* Listing Type Badge */}
                {getListingTypeBadge() && (
                  <div className="absolute top-2 left-2 z-20">
                    {getListingTypeBadge()}
                  </div>
                )}
                {/* Image Navigation */}
                {hasMultipleImages && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full shadow-lg h-8 w-8 z-10 backdrop-blur-sm"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white rounded-full shadow-lg h-8 w-8 z-10 backdrop-blur-sm"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    {/* Image Counter */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium z-10">
                      {currentImageIndex + 1} / {images.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Home className="h-16 w-16 text-slate-400" />
              </div>
            )}
          </div>

          {/* Right: Property Details - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-slate-50/50 custom-scrollbar">
            <div className="p-4 sm:p-6 space-y-4">
              {/* Quick Stats - Compact */}
              <div className="grid grid-cols-4 gap-2">
                {property.bedrooms !== undefined && (
                  <Card className="border border-slate-200 hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 text-center">
                      <Bed className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-sm sm:text-base font-bold text-slate-800">{property.bedrooms}</div>
                      <div className="text-[10px] text-slate-600 font-medium">Beds</div>
                    </CardContent>
                  </Card>
                )}
                {property.bathrooms !== undefined && (
                  <Card className="border border-slate-200 hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 text-center">
                      <Bath className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-sm sm:text-base font-bold text-slate-800">{property.bathrooms}</div>
                      <div className="text-[10px] text-slate-600 font-medium">Baths</div>
                    </CardContent>
                  </Card>
                )}
                {property.sqft && (
                  <Card className="border border-slate-200 hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 text-center">
                      <Square className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-sm sm:text-base font-bold text-slate-800">{property.sqft}</div>
                      <div className="text-[10px] text-slate-600 font-medium">Sq Ft</div>
                    </CardContent>
                  </Card>
                )}
                {property.yearBuilt && (
                  <Card className="border border-slate-200 hover:border-primary/50 transition-colors">
                    <CardContent className="p-3 text-center">
                      <Calendar className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-sm sm:text-base font-bold text-slate-800">{property.yearBuilt}</div>
                      <div className="text-[10px] text-slate-600 font-medium">Built</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Rating */}
              {property.rating && (
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-center gap-0.5">{renderStars(property.rating)}</div>
                  <span className="text-sm font-semibold text-slate-800">{property.rating}</span>
                  <span className="text-xs text-slate-600">/ 5.0</span>
                  {property.agent && (
                    <span className="text-xs text-slate-600 ml-auto">by {property.agent}</span>
                  )}
                </div>
              )}

              {/* Tabs - Compact */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-9 bg-white mb-3">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Overview</TabsTrigger>
                  <TabsTrigger value="features" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Features</TabsTrigger>
                  <TabsTrigger value="location" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Location</TabsTrigger>
                  <TabsTrigger value="contact" className="text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-white">Contact</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-3">
                  {property.description && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-2">Description</h3>
                        <p className="text-sm text-slate-600 leading-relaxed line-clamp-4">
                          {property.description}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {property.highlights && property.highlights.length > 0 && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="text-base font-bold text-slate-800 mb-2">Highlights</h3>
                        <ul className="space-y-1.5">
                          {property.highlights.slice(0, 4).map((highlight, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-3.5 w-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-xs text-slate-600 leading-relaxed">{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* Additional Info - Compact Grid */}
                  {(property.propertyTax || property.hoaFee || property.daysOnMarket || property.utilities) && (
                    <div className="grid grid-cols-2 gap-2">
                      {property.propertyTax && (
                        <Card className="shadow-sm border border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <DollarSign className="h-3.5 w-3.5 text-primary" />
                              <h4 className="text-xs font-semibold text-slate-800">Property Tax</h4>
                            </div>
                            <p className="text-xs text-slate-600">{property.propertyTax}</p>
                          </CardContent>
                        </Card>
                      )}
                      {property.hoaFee && (
                        <Card className="shadow-sm border border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Building2 className="h-3.5 w-3.5 text-primary" />
                              <h4 className="text-xs font-semibold text-slate-800">HOA Fee</h4>
                            </div>
                            <p className="text-xs text-slate-600">{property.hoaFee}</p>
                          </CardContent>
                        </Card>
                      )}
                      {property.daysOnMarket && (
                        <Card className="shadow-sm border border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="h-3.5 w-3.5 text-primary" />
                              <h4 className="text-xs font-semibold text-slate-800">Days on Market</h4>
                            </div>
                            <p className="text-xs text-slate-600">{property.daysOnMarket} days</p>
                          </CardContent>
                        </Card>
                      )}
                      {property.utilities && (
                        <Card className="shadow-sm border border-slate-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <Home className="h-3.5 w-3.5 text-primary" />
                              <h4 className="text-xs font-semibold text-slate-800">Utilities</h4>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">{property.utilities}</p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {property.mortgageInfo && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-3">
                        <h4 className="text-xs font-semibold text-slate-800 mb-1">Financing</h4>
                        <p className="text-xs text-slate-600 line-clamp-2">{property.mortgageInfo}</p>
                        {property.specialTerms && (
                          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                            <strong>Special:</strong> {property.specialTerms}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="mt-0 space-y-3">
                  {property.features && property.features.length > 0 && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="text-base font-bold text-slate-800 mb-3">Property Features</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {property.features.map((feature, index) => (
                            <div key={index} className="flex items-center gap-1.5 p-2 bg-slate-50 rounded text-xs">
                              <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                              <span className="text-slate-700">{feature}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {property.amenities && property.amenities.length > 0 && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="text-base font-bold text-slate-800 mb-3">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary" className="text-xs px-2 py-0.5">
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Location Tab */}
                <TabsContent value="location" className="mt-0">
                  <Card className="shadow-sm border border-slate-200">
                    <CardContent className="p-4">
                      <h3 className="text-base font-bold text-slate-800 mb-3">Location</h3>
                      <div className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg mb-3">
                        <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{property.address}</p>
                          {(property.city || property.state || property.zipCode) && (
                            <p className="text-xs text-slate-600 mt-1">
                              {property.city}, {property.state} {property.zipCode}
                            </p>
                          )}
                        </div>
                      </div>
                      <PropertyLocationMap
                        latitude={property.latitude || property.coordinates?.lat || undefined}
                        longitude={property.longitude || property.coordinates?.lng || undefined}
                        address={property.address || ''}
                        city={property.city || ''}
                        state={property.state || ''}
                        zipCode={property.zipCode || property.zip_code || ''}
                        height="h-64"
                        className="w-full"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Contact Tab */}
                <TabsContent value="contact" className="mt-0 space-y-3">
                  {property.agent && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="text-base font-bold text-slate-800 mb-3">Listing Agent</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {property.agent.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 text-sm">{property.agent}</div>
                            {property.rating && (
                              <div className="flex items-center gap-1 mt-1">
                                {renderStars(property.rating)}
                                <span className="text-xs text-slate-600 ml-1">{property.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {property.agentPhone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-9 text-xs mb-2"
                            onClick={() => window.location.href = `tel:${property.agentPhone}`}
                          >
                            <Phone className="h-3.5 w-3.5 mr-2" />
                            {property.agentPhone}
                          </Button>
                        )}
                        {property.agentEmail && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-9 text-xs"
                            onClick={() => window.location.href = `mailto:${property.agentEmail}`}
                          >
                            <Mail className="h-3.5 w-3.5 mr-2" />
                            {property.agentEmail}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {property.owner && property.owner.name && (
                    <Card className="shadow-sm border border-slate-200">
                      <CardContent className="p-4">
                        <h3 className="text-base font-bold text-slate-800 mb-3">Property Owner</h3>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="h-12 w-12 bg-slate-500 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {property.owner.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="font-semibold text-slate-800 text-sm">{property.owner.name}</div>
                        </div>
                        {property.owner.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-9 text-xs mb-2"
                            onClick={() => window.location.href = `tel:${property.owner.phone}`}
                          >
                            <Phone className="h-3.5 w-3.5 mr-2" />
                            {property.owner.phone}
                          </Button>
                        )}
                        {property.owner.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start h-9 text-xs"
                            onClick={() => window.location.href = `mailto:${property.owner.email}`}
                          >
                            <Mail className="h-3.5 w-3.5 mr-2" />
                            {property.owner.email}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons - Fixed at Bottom */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 mt-4 shadow-lg">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.location.href = `tel:+14129777090`}
                    className="flex-1 bg-primary hover:bg-primary/90 h-10 text-sm font-semibold shadow-md"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Tour
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `mailto:info@pittmetrorealty.com`}
                    className="flex-1 h-10 text-sm font-semibold border-2 hover:bg-primary hover:text-white"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Agent
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `tel:+14129777090`}
                    className="flex-1 h-10 text-sm font-semibold border-2 hover:bg-primary hover:text-white"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Now
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyDetailsModal;
