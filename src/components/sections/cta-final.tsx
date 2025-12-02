"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const CtaFinal = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      id="cta"
      className="relative overflow-hidden bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] py-32 px-5 md:py-[80px] md:px-10"
    >
      
      {/* Floating elements for maximum fun */}
      <div
        className="absolute top-[15%] left-[5%] w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.2}px) rotate(-12deg)`,
        }}
      >
        <div className="text-[60px] md:text-[80px] lg:text-[100px] drop-shadow-lg">🐻</div>
      </div>

      <div
        className="absolute top-[25%] right-[12%] w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * -0.4}px, ${mousePosition.y * 0.1}px) rotate(25deg)`,
        }}
      >
        <div className="text-[48px] md:text-[64px] lg:text-[80px] drop-shadow-lg">🍕</div>
      </div>

      <div
        className="absolute bottom-[20%] left-[12%] w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * -0.3}px) rotate(-35deg)`,
        }}
      >
        <div className="text-[42px] md:text-[56px] lg:text-[72px] drop-shadow-lg">🎉</div>
      </div>

      <div
        className="absolute top-[35%] left-[15%] w-12 h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * -0.2}px, ${mousePosition.y * 0.4}px) rotate(45deg)`,
        }}
      >
        <div className="text-[36px] md:text-[48px] lg:text-[60px] drop-shadow-lg">✨</div>
      </div>

      <div
        className="absolute bottom-[35%] right-[8%] w-14 h-14 md:w-18 md:h-18 lg:w-20 lg:h-20 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * -0.6}px, ${mousePosition.y * 0.2}px) rotate(-20deg)`,
        }}
      >
        <div className="text-[42px] md:text-[56px] lg:text-[72px] drop-shadow-lg">💖</div>
      </div>

      <div
        className="absolute top-[45%] right-[5%] w-10 h-10 md:w-14 md:h-14 lg:w-16 lg:h-16 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * -0.1}px) rotate(60deg)`,
        }}
      >
        <div className="text-[30px] md:text-[42px] lg:text-[56px] drop-shadow-lg">🌟</div>
      </div>

      <div
        className="absolute bottom-[15%] right-[15%] w-12 h-12 md:w-16 md:h-16 lg:w-18 lg:h-18 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * 0.5}px) rotate(-45deg)`,
        }}
      >
        <div className="text-[36px] md:text-[48px] lg:text-[60px] drop-shadow-lg">🎊</div>
      </div>

      <div
        className="absolute top-[55%] left-[8%] w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 transition-transform duration-300 ease-out z-5"
        style={{
          transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.3}px) rotate(30deg)`,
        }}
      >
        <div className="text-[30px] md:text-[36px] lg:text-[48px] drop-shadow-lg">💫</div>
      </div>

      <div className="container relative flex flex-col items-center gap-10 md:gap-16 z-10">

        {/* Main Content - Brutalist Typography */}
        <div className="relative z-10 text-center">
          <div className="relative select-none pointer-events-none">
            <h1 className="font-black text-white leading-[0.8] lowercase text-[6rem] md:text-[10rem] lg:text-[12rem] tracking-tighter drop-shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative z-20">
              join the fun
            </h1>
            {/* Enhanced slanted shadow with gradient effect */}
            <h1 className="absolute top-4 left-8 font-black text-transparent bg-gradient-to-r from-black/70 to-black/40 bg-clip-text leading-[0.8] lowercase text-[6rem] md:text-[10rem] lg:text-[12rem] tracking-tighter -z-10 blur-sm transform rotate-4 scale-[1.03] skew-x-4">
              join the fun
            </h1>
            {/* Deep shadow layer for more depth */}
            <h1 className="absolute top-8 left-4 font-black text-black/50 leading-[0.8] lowercase text-[6rem] md:text-[10rem] lg:text-[12rem] tracking-tighter -z-20 blur-md transform rotate-8 scale-[1.06] skew-x-8">
              join the fun
            </h1>
            {/* Extra layer for that Wizzmo flair */}
            <h1 className="absolute top-2 left-12 font-black text-[#FF4DB8]/30 leading-[0.8] lowercase text-[6rem] md:text-[10rem] lg:text-[12rem] tracking-tighter -z-15 blur-lg transform rotate-2 scale-[1.01] skew-x-2">
              join the fun
            </h1>
          </div>
          <p className="mt-8 text-white/90 font-bold text-xl md:text-2xl max-w-2xl mx-auto">
            scan & start getting real advice from real college girls
          </p>
        </div>

        {/* QR Code with enhanced styling */}
        <div className="relative z-10 mt-12">
          <div className="relative bg-white p-6 border-6 border-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] transform hover:scale-105 transition-all duration-300 hover:shadow-[0_25px_50px_rgba(0,0,0,0.4)] hover:rotate-2">
            <div className="absolute inset-0 bg-gradient-to-br from-[#FF4DB8]/5 to-[#8B5CF6]/5"></div>
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/svgs/hmSZpaMLU2rHM0jlQdLVDRJajTk-2.svg"
              alt="QR code to download the Wizzmo app"
              width={200}
              height={200}
              className="h-auto w-[180px] md:w-[220px] relative z-10"
            />
            <div className="absolute -top-2 -right-2 bg-[#FF4DB8] text-white text-sm px-3 py-2 font-black uppercase tracking-wide border-2 border-white shadow-[0_4px_12px_rgba(0,0,0,0.3)]">
              SCAN ME
            </div>
          </div>
        </div>

        {/* App Store Buttons with brutalist styling */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6 mt-8">
          <a
            href="https://apps.apple.com/app/wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative"
          >
            <Image
              src="/app store.png"
              alt="Download on App Store"
              width={200}
              height={60}
              className="transform group-hover:scale-105 transition-all duration-300 border-4 border-white group-hover:border-black shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
            />
          </a>
          <button
            onClick={() => {
              const modal = document.createElement('div');
              modal.className = 'fixed inset-0 bg-black/80 flex items-center justify-center z-50';
              modal.innerHTML = `
                <div class="bg-white p-8 rounded-none border-4 border-black max-w-md mx-4 text-center">
                  <h2 class="text-2xl font-black lowercase mb-4">coming soon!</h2>
                  <p class="text-gray-700 mb-6">we're working hard to bring wizzmo to android. stay tuned! 🚀</p>
                  <button onclick="this.parentElement.parentElement.remove()" class="bg-black text-white px-6 py-3 font-black uppercase tracking-wide hover:bg-gray-800 transition-colors">
                    got it
                  </button>
                </div>
              `;
              document.body.appendChild(modal);
            }}
            className="group relative opacity-75 hover:opacity-100 transition-opacity"
          >
            <Image
              src="/google play.png"
              alt="Coming Soon on Google Play"
              width={200}
              height={60}
              className="transform group-hover:scale-105 transition-all duration-300 border-4 border-white group-hover:border-yellow-400 shadow-[0_8px_20px_rgba(0,0,0,0.3)]"
            />
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <span className="bg-yellow-400 text-black font-black px-3 py-1 text-sm uppercase tracking-wide">
                NOT READY
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CtaFinal;