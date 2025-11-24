import { useState } from "react";
import { Home, DollarSign, MapPin, Calendar, Phone, Mail, CheckCircle, Star, ArrowRight, Users, Award, Clock, User, Building, CreditCard, FileText, Shield, Clock3, Target, TrendingUp, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { emailAPI } from "@/lib/api/email";
import { useToast } from "@/hooks/use-toast";

const Sell = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredContact: 'email',
    description: '',
    
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Please enter a valid email';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      console.log('Sending sell inquiry email:', formData);
      
      await emailAPI.sendSellInquiry({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        preferredContact: formData.preferredContact as 'email' | 'phone' | 'text',
        description: formData.description
      });

      toast({
        title: "Application Submitted Successfully!",
        description: "Thank you! We will contact you within 24 hours to discuss your property sale.",
        variant: "default",
      });

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        preferredContact: 'email',
        description: '',
      });
      setErrors({});
      
    } catch (error: any) {
      console.error('Error submitting form:', error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit your application. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const testimonials = [
    {
      name: "Sarah Johnson",
      location: "Shadyside, Pittsburgh",
      text: "Pitt Metro Realty helped us sell our home for 15% above asking price in just 3 weeks!",
      rating: 5,
      salePrice: "$850,000"
    },
    {
      name: "Michael Chen",
      location: "Squirrel Hill, Pittsburgh", 
      text: "Professional service from start to finish. Highly recommend!",
      rating: 5,
      salePrice: "$1.2M"
    },
    {
      name: "Emily Rodriguez",
      location: "Mount Lebanon, Pittsburgh",
      text: "The market analysis was spot-on and helped us price perfectly.",
      rating: 5,
      salePrice: "$675,000"
    }
  ];

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
              <DollarSign className="h-4 w-4" />
              Maximize Your Property Value
            </div>
            
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 md:mb-5 leading-tight px-2">
              Sell Your Property
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                With Confidence
              </span>
            </h1>
            
            <p className="text-xs sm:text-sm md:text-base text-white/90 mb-5 sm:mb-6 md:mb-7 leading-relaxed max-w-2xl mx-auto px-3 sm:px-4">
              Get maximum value for your property with our proven selling strategy, 
              expert market analysis, and professional marketing.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 md:gap-4 px-2">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Market Analysis</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 text-blue-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Professional Photos</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Expert Agents</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-full touch-target">
                <Award className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-300 flex-shrink-0" />
                <span className="font-medium text-xs sm:text-sm">Proven Results</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-16 left-8 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-16 right-8 w-24 h-24 bg-yellow-300/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-blue-300/10 rounded-full blur-xl"></div>
      </section>

      {/* Steps Section */}
      <section className="section-spacing-xl relative py-3 sm:py-5 md:py-6">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-transparent"></div>
        <div className="relative container-spacing px-3 sm:px-4 md:px-5 lg:px-6 max-w-4xl mx-auto w-full">
          <div className="text-center mb-4 sm:mb-6 md:mb-8">
            
            
          </div>


          {/* Form Content */}
          <Card className="max-w-xl mx-auto w-full shadow-xl border border-slate-200/50 bg-white/90 backdrop-blur-sm">
            <CardHeader className="text-center pb-3 sm:pb-4 bg-gradient-to-r from-slate-50/80 via-slate-50/60 to-slate-50/80 rounded-t-lg border-b border-slate-200 p-3 sm:p-4 md:p-5">
              <CardTitle className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                Personal Information
              </CardTitle>
              <p className="text-slate-600 text-xs sm:text-sm md:text-base mt-1">
                Tell us about yourself
              </p>
            </CardHeader>
            <CardContent className="card-content-spacing p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="form-spacing space-y-2.5 sm:space-y-3 md:space-y-4">
                  <div className="text-center mb-4 sm:mb-5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary/10 to-primary-light/20 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                      <User className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
                    </div>
                    <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 mb-1">Let's Get to Know You</h3>
                    <p className="text-slate-600 text-xs sm:text-sm md:text-base px-4">We'll use this information to provide personalized service</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700">
                        First Name *
                      </Label>
                      <Input 
                        id="firstName"
                        placeholder="John" 
                        className={`h-11 px-4 py-3 text-sm border-2 focus:border-primary rounded-lg transition-all duration-300 ${errors.firstName ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                      />
                      {errors.firstName && <p className="text-red-500 text-sm mt-1 animate-pulse">{errors.firstName}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700">
                        Last Name *
                      </Label>
                      <Input 
                        id="lastName"
                        placeholder="Doe" 
                        className={`h-11 px-4 py-3 text-sm border-2 focus:border-primary rounded-lg transition-all duration-300 ${errors.lastName ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                      />
                      {errors.lastName && <p className="text-red-500 text-sm mt-1 animate-pulse">{errors.lastName}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label htmlFor="email" className="text-sm font-semibold text-slate-700">
                        Email Address *
                      </Label>
                      <Input 
                        id="email"
                        type="email"
                        placeholder="john@example.com" 
                        className={`h-11 px-4 py-3 text-sm border-2 focus:border-primary rounded-lg transition-all duration-300 ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                      />
                      {errors.email && <p className="text-red-500 text-sm mt-1 animate-pulse">{errors.email}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-semibold text-slate-700">
                        Phone Number *
                      </Label>
                      <Input 
                        id="phone"
                        placeholder="+1-412-977-7090" 
                        className={`h-11 px-4 py-3 text-sm border-2 focus:border-primary rounded-lg transition-all duration-300 ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                      {errors.phone && <p className="text-red-500 text-sm mt-1 animate-pulse">{errors.phone}</p>}
                    </div>
                  </div>
                  

                  <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold text-slate-800">
                      Description *
                      </Label>
                      <Textarea 
                        id="description"
                        placeholder="Tell us about your property and selling requirements..." 
                        className={`min-h-[120px] px-4 py-3 text-sm border-2 focus:border-primary rounded-lg transition-all duration-300 ${errors.description ? 'border-red-500 focus:border-red-500' : 'border-slate-200'}`}
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                      />
                      {errors.description && <p className="text-red-500 text-sm mt-1 animate-pulse">{errors.description}</p>}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-slate-700">Preferred Contact Method</Label>
                    <RadioGroup 
                      value={formData.preferredContact} 
                      onValueChange={(value) => handleInputChange('preferredContact', value)}
                      className="flex flex-col space-y-3"
                    >
                      <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 transition-all duration-300 hover:shadow-md">
                        <RadioGroupItem value="email" id="email-contact" />
                        <Label htmlFor="email-contact" className="flex items-center gap-2 cursor-pointer">
                          <Mail className="h-4 w-4 text-primary" />
                          Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 transition-all duration-300 hover:shadow-md">
                        <RadioGroupItem value="phone" id="phone-contact" />
                        <Label htmlFor="phone-contact" className="flex items-center gap-2 cursor-pointer">
                          <Phone className="h-4 w-4 text-primary" />
                          Phone Call
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-4 border-2 rounded-lg hover:bg-slate-50 transition-all duration-300 hover:shadow-md">
                        <RadioGroupItem value="text" id="text-contact" />
                        <Label htmlFor="text-contact" className="flex items-center gap-2 cursor-pointer">
                          <Phone className="h-4 w-4 text-primary" />
                          Text Message
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

              {/* Navigation Buttons */}
              <div className="flex justify-center pt-6 border-t border-slate-200">
                <Button 
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-8 py-2.5 h-12 bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 transition-all duration-300 shadow-lg hover:shadow-xl text-sm sm:text-base font-semibold min-h-[48px] touch-target disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

     
     


      {/* CTA Section */}
      <section className="py-4 sm:py-6 md:py-8 bg-gradient-to-r from-primary to-primary-light text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary-light/90"></div>
        <div className="relative max-w-xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 text-center w-full">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 drop-shadow-lg px-2">
            Ready to Sell Your Property?
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-white/90 mb-4 sm:mb-5 drop-shadow-md px-4">
            Start your selling journey today with Pitt Metro Realty
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Button 
              size="lg" 
              onClick={() => {
                window.location.href = `tel:+14129777090`;
              }}
              className="bg-white text-primary hover:bg-white/90 h-12 sm:h-14 px-6 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 min-h-[48px] touch-target"
            >
              <Phone className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" />
              Call +1-412-977-7090
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sell;