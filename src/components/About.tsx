import { Users, Award, Clock, TrendingUp, Phone, Mail, MapPin, Star, CheckCircle, ArrowRight, Heart, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import profileImage from "@/assets/amit-aggarwal-profile.jpg";

const About = () => {
  const stats = [
    { number: "500+", label: "Properties Sold", icon: TrendingUp, color: "from-blue-500 to-blue-600" },
    { number: "15+", label: "Years Experience", icon: Clock, color: "from-green-500 to-green-600" },
    { number: "98%", label: "Client Satisfaction", icon: Award, color: "from-yellow-500 to-yellow-600" },
    { number: "24/7", label: "Support Available", icon: Users, color: "from-purple-500 to-purple-600" }
  ];

  const values = [
    {
      icon: Heart,
      title: "Client-First Approach",
      description: "Every decision we make is guided by what's best for our clients' success and satisfaction.",
      color: "from-red-500 to-red-600"
    },
    {
      icon: Shield,
      title: "Integrity & Trust",
      description: "We maintain the highest ethical standards and build lasting relationships through transparency.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Zap,
      title: "Innovation",
      description: "We leverage cutting-edge technology and creative solutions to deliver exceptional results.",
      color: "from-yellow-500 to-yellow-600"
    },
    {
      icon: Award,
      title: "Excellence",
      description: "We strive for perfection in every transaction, ensuring outstanding outcomes for our clients.",
      color: "from-green-500 to-green-600"
    }
  ];

  const team = [
    {
      name: "Sarah Johnson",
      role: "CEO & Founder",
      experience: "15+ years",
      specialty: "Luxury Properties",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Mike Chen",
      role: "Senior Agent",
      experience: "12+ years",
      specialty: "Investment Properties",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Emily Rodriguez",
      role: "Property Manager",
      experience: "10+ years",
      specialty: "Commercial Real Estate",
      image: "/api/placeholder/150/150"
    }
  ];

  return (
    <section id="about" className="py-8 sm:py-12 md:py-16 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-10 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-16 animate-fade-in-up">
          <div className="inline-block mb-4">
            <Badge className="px-4 py-1.5 text-xs sm:text-sm bg-primary/10 text-primary border-primary/20">
              About Us
            </Badge>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">
            About <span className="text-primary">Pitt Metro Realty</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed mb-6 sm:mb-8 px-4">
            With over 15 years of experience in the real estate industry, Pitt Metro Realty has been 
            the trusted partner for thousands of clients in their property journey.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8 px-2">
            <Badge variant="outline" className="px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 group shadow-sm">
              <div className="w-6 h-6 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
                <Award className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold">Licensed & Certified</span>
            </Badge>
            <Badge variant="outline" className="px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 group shadow-sm">
              <div className="w-6 h-6 bg-yellow-100 rounded-lg flex items-center justify-center group-hover:bg-yellow-200 transition-all duration-300">
                <Star className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="font-semibold">Award Winning Team</span>
            </Badge>
            <Badge variant="outline" className="px-5 py-2.5 text-xs sm:text-sm flex items-center gap-2.5 bg-white/90 backdrop-blur-sm border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-all duration-300 hover:scale-105 group shadow-sm">
              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center group-hover:bg-green-200 transition-all duration-300">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-semibold">Insured & Bonded</span>
            </Badge>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 mb-10 sm:mb-12 md:mb-16">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.label}
                className="text-center p-4 sm:p-6 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-up border-0"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-0">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg`}>
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-white" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-1 sm:mb-2">{stat.number}</h3>
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 font-medium">{stat.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content - Meet Your Agent */}
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden mb-10 sm:mb-12 md:mb-16 w-full border border-slate-200/50">
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] items-stretch min-h-[500px]">
            {/* Left Column - Biography */}
            <div className="p-6 sm:p-8 md:p-10 lg:p-12 animate-slide-in-left flex flex-col justify-center bg-gradient-to-br from-white to-slate-50/50">
              <div className="mb-4">
                <Badge className="px-3 py-1 text-xs bg-primary/10 text-primary border-primary/20 mb-4">
                  Your Trusted Agent
                </Badge>
              </div>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">
                Meet Your Agent
              </h3>
              <div className="space-y-4 sm:space-y-5 text-slate-700">
                <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                  With a stellar track record of over <span className="font-semibold text-primary">$125 million in sales</span> from 2020 to 2024, 
                  I bring over two decades of experience and hundreds of closed transactions to every client. 
                  My approach is built on positivity, professionalism, and an unparalleled dedication to 
                  delivering exceptional service and results.
                </p>
                <p className="text-base sm:text-lg md:text-xl leading-relaxed">
                  My tenacious work ethic drives me to go above and beyond for my clients, persisting 
                  where others might falter. I firmly believe in never taking no for an answer — where 
                  there is a will, there is a way, and I am relentless in my pursuit of finding it.
                </p>
              </div>
            </div>

            {/* Right Column - Profile Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-6 sm:p-8 md:p-10 lg:p-12 border-t lg:border-t-0 lg:border-l border-slate-200 animate-slide-in-right flex items-center justify-center">
              <div className="w-full max-w-sm">
                <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 border border-slate-200/50">
                  {/* Profile Image */}
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-xl"></div>
                      <img 
                        src={profileImage} 
                        alt="Amit Aggarwal - Real Estate Expert" 
                        className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl ring-4 ring-primary/10"
                      />
                    </div>
                  </div>
                  
                  {/* Name */}
                  <h4 className="text-2xl sm:text-3xl font-bold text-slate-900 text-center mb-2">
                    Amit Aggarwal
                  </h4>

                  {/* Title */}
                  <p className="text-sm sm:text-base font-medium text-slate-600 text-center mb-6 px-2">
                    Real Estate Expert | Licensed Agent
                  </p>

                  {/* Contact Information */}
                  <div className="space-y-3 sm:space-y-3.5 mb-6">
                    <div className="flex items-center justify-center gap-2 text-center">
                      <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                      <a href="tel:+14129777090" className="text-sm sm:text-base font-semibold text-slate-900 hover:text-primary transition-colors">
                        +1-412-977-7090
                      </a>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-center">
                      <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                      <a href="mailto:aggarwal_a@hotmail.com" className="text-sm sm:text-base font-semibold text-slate-900 break-all hover:text-primary transition-colors">
                        aggarwal_a@hotmail.com
                      </a>
                    </div>

                    <div className="flex items-start justify-center gap-2 text-center">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-slate-900">201 Sonni Ln</p>
                        <p className="text-sm sm:text-base font-semibold text-slate-900">McKees Rocks, PA 15136</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-2 text-center pt-2 border-t border-slate-200">
                      <a href="https://pittmetrorealty.com" target="_blank" rel="noopener noreferrer" className="text-sm sm:text-base font-semibold text-slate-900 hover:text-primary transition-colors break-all">
                        pittmetrorealty.com
                      </a>
                    </div>
                  </div>

                  {/* Social Media Icons */}
                  <div className="flex items-center justify-center gap-3 pt-4 border-t border-slate-200">
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="group touch-target">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110">
                        <span className="text-white text-sm font-bold">f</span>
                      </div>
                    </a>
                    
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="group touch-target">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110">
                        <span className="text-white text-sm font-bold">in</span>
                      </div>
                    </a>
                    
                    <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="group touch-target">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-110">
                        <span className="text-white text-sm">▶</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-10 sm:mb-12 md:mb-16">
          <div className="text-center mb-8 sm:mb-10 md:mb-12 animate-fade-in-up">
            <Badge className="px-4 py-1.5 text-xs sm:text-sm bg-primary/10 text-primary border-primary/20 mb-4">
              Our Foundation
            </Badge>
            <h3 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">
              Our Core <span className="text-primary">Values</span>
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto px-4 leading-relaxed">
              The principles that guide everything we do and every relationship we build.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 md:gap-8">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <Card 
                  key={value.title}
                  className="text-center p-6 sm:p-7 md:p-8 bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-fade-in-up flex flex-col border-0 group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-0 flex flex-col items-center">
                    <div className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 bg-gradient-to-br ${value.color} rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 text-white" />
                    </div>
                    <h4 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 mb-3 sm:mb-4">{value.title}</h4>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed flex-grow">{value.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-br from-primary/5 via-white to-blue-50/30 rounded-2xl sm:rounded-3xl p-8 sm:p-10 md:p-12 lg:p-16 shadow-lg border border-primary/10">
          <div className="max-w-4xl mx-auto text-center">
            <Badge className="px-4 py-1.5 text-xs sm:text-sm bg-primary/10 text-primary border-primary/20 mb-6">
              Our Mission
            </Badge>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 mb-4 sm:mb-6 tracking-tight">
              Our Commitment to You
            </h3>
            <p className="text-base sm:text-lg md:text-xl text-slate-700 leading-relaxed max-w-3xl mx-auto">
              At Pitt Metro Realty, we are committed to providing exceptional real estate services 
              that exceed expectations. Our mission is to help you achieve your property goals through 
              expert guidance, personalized attention, and unwavering dedication to your success.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;