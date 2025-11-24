import React from 'react';
import logoImage from '@/assets/pittmetrorealtylog.png';

const PageLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex flex-col items-center justify-center">
      {/* Main Loading Content - Centered */}
      <div className="flex flex-col items-center justify-center">
        {/* Large Logo with Spinning Circle */}
        <div className="mb-10 sm:mb-12 md:mb-14">
          <div className="relative">
            <img 
              src={logoImage} 
              alt="Pittmetro Realty Logo" 
              className="h-32 w-auto sm:h-40 sm:w-auto md:h-48 md:w-auto lg:h-56 lg:w-auto bg-transparent"
              style={{ background: 'transparent' }}
            />
            {/* Professional Spinning Ring Around Logo */}
            <div className="absolute inset-0 flex items-center justify-center -m-6 sm:-m-8">
              <div className="w-full h-full border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
            </div>
          </div>
        </div>
        
        {/* Professional Loading Text */}
        <div className="text-center">
          <p className="text-base sm:text-lg md:text-xl text-slate-700 font-medium tracking-wide">
            Loading...
          </p>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;

