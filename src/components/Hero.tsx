import { useState, useEffect } from "react";
import { TrendingUp, Building2, Users } from "lucide-react";
import { Home } from "lucide-react";
import heroImage from "@/assets/hero-property.jpg";
import { useNavigate, useLocation } from "react-router-dom";
import { LazyLoadImage } from 'react-lazy-load-image-component'
import 'react-lazy-load-image-component/src/effects/blur.css'

const Hero = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine active tab based on current route
  const getActiveTabFromRoute = () => {
    const path = location.pathname;
    // Only set active tab if we're on a specific page, not on landing page
    if (path.includes('/sell')) return 'sell';
    if (path.includes('/buy')) return 'buy';
    if (path.includes('/rent')) return 'rent';
    return null; // No tab selected on landing page
  };

  const [activeTab, setActiveTab] = useState<string | null>(getActiveTabFromRoute());

  // Update active tab when route changes (only if on specific page, not landing)
  useEffect(() => {
    const routeTab = getActiveTabFromRoute();
    // Only update if we're on a specific page (not landing page)
    if (routeTab !== null) {
      setActiveTab(routeTab);
    } else {
      // On landing page, reset to no selection
      setActiveTab(null);
    }
  }, [location.pathname]);

  const tabs = [
    { id: "sell", label: "Sell", href: "/sell", icon: TrendingUp },
    { id: "buy", label: "Buy", href: "/buy", icon: Home },
    { id: "rent", label: "Rent", href: "/rent", icon: Building2 },
    // Manage button hidden as per requirements
  ];

  const handleTabClick = (tabId: string) => {
    // Update the active tab state when user clicks
    setActiveTab(tabId);
    
    // Navigate directly to the selected tab's page
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      navigate(tab.href);
    }
  };


  return (
    <section id="home" className="relative min-h-screen flex items-center pt-20 sm:pt-22 md:pt-24 lg:pt-26 overflow-hidden bg-gradient-to-br from-slate-800 via-gray-900 to-slate-900 safe-top">
      {/* Background Image with Enhanced Animation */}
      <div className="absolute inset-0 z-0">
        <LazyLoadImage
          src={heroImage}
          alt="Luxury property showcase"
          effect="blur"
          width="100%"
          height="100%"
          placeholderSrc="/placeholder.svg"
          className="w-full h-full object-cover animate-gradient-shift"
        />
        {/* Professional gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800/85 via-gray-900/75 to-slate-900/85" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800/70 via-transparent to-transparent" />
        
        {/* Floating Elements - Hidden on mobile for better performance */}
        <div className="hidden sm:block absolute top-20 left-10 w-20 h-20 bg-white/5 rounded-full animate-float-1"></div>
        <div className="hidden md:block absolute top-40 right-20 w-16 h-16 bg-primary/10 rounded-full animate-float-2"></div>
        <div className="hidden lg:block absolute bottom-40 left-20 w-24 h-24 bg-yellow-400/10 rounded-full animate-float-3"></div>
        <div className="hidden sm:block absolute bottom-20 right-10 w-12 h-12 bg-white/10 rounded-full animate-float-4"></div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-5 lg:px-6 relative z-10 w-full py-5 sm:py-6 md:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Headline with Enhanced Animation */}
          <div className="text-center mb-6 sm:mb-8 md:mb-10 animate-fade-in-up">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-2 sm:mb-3 md:mb-4 leading-tight px-2">
              <span className="block animate-slide-in-left">Discover</span>
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-100 mt-2 sm:mt-3 animate-slide-in-right">
                Exceptional Properties
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-white/95 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in px-4 sm:px-6">
              Premium properties and exceptional service with Pitt Metro Realty. 
              Your trusted partner in real estate excellence.
            </p>
          </div>

          {/* Enhanced Category Selection Section - Professional UI/UX */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-2 sm:p-2.5 shadow-xl border border-slate-200/60 animate-scale-in mx-auto max-w-xs sm:max-w-sm w-full">
            <p className="text-[10px] sm:text-xs text-slate-600 mb-2 sm:mb-2.5 text-center font-medium px-1 tracking-tight">
              Select a category to search
            </p>
            <div className="flex flex-nowrap justify-center items-stretch gap-1.5 sm:gap-2 bg-transparent rounded-lg p-1 w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`flex-1 px-1.5 sm:px-2 py-2 sm:py-2.5 rounded-lg font-medium transition-all duration-200 text-[10px] sm:text-xs flex flex-col items-center justify-center gap-1.5 touch-target min-h-[42px] sm:min-h-[48px] relative group bg-white border ${
                      isActive
                        ? "border-primary/60 text-primary shadow-sm scale-[1.03] bg-primary/8 ring-1 ring-primary/20"
                        : "border-slate-200/80 text-slate-600 hover:text-primary hover:border-primary/50 hover:shadow-sm hover:scale-[1.02] hover:bg-slate-50/80"
                    }`}
                    aria-pressed={isActive}
                    title={`Click to explore ${tab.label.toLowerCase()} properties`}
                  >
                    {/* Icon */}
                    <div className={`transition-transform duration-200 ${isActive ? 'scale-105' : 'group-hover:scale-105'}`}>
                      <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-colors duration-200 ${
                        isActive ? 'text-primary' : 'text-slate-500 group-hover:text-primary'
                      }`} />
                    </div>
                    
                    {/* Label */}
                    <span className={`text-[10px] sm:text-xs font-semibold transition-colors duration-200 whitespace-nowrap ${
                      isActive ? 'text-primary' : 'text-slate-600 group-hover:text-primary'
                    }`}>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;