"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const HeroSection = () => {
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
      id="hero"
      className="relative w-full h-[90vh] md:h-[95vh] lg:h-[100vh] overflow-hidden bg-gradient-to-br from-[#FF4DB8] via-[#C147E9] to-[#8B5CF6] pt-16"
    >

      {/* Only 2 mentor photos max - strategically placed */}
      <div
        className="absolute top-[10%] left-[5%] w-[180px] h-[240px] sm:w-[220px] sm:h-[280px] lg:top-[8%] lg:left-[calc(50%-550px)] lg:w-[320px] lg:h-[400px] transition-transform duration-300 ease-out z-20"
        style={{
          transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * 0.2}px) rotate(-8deg)`,
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/girl1.png"
            alt="Real college mentor"
            width={400}
            height={500}
            className="object-cover rounded-2xl w-full h-full border-4 border-white shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)]"
            priority
          />
        </div>
      </div>

      {/* Waving hand - enhanced */}
      <div
        className="absolute top-[15%] right-[5%] w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] lg:right-[calc(50%-450px)] lg:top-[20%] lg:w-[180px] lg:h-[180px] transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.6}px, ${mousePosition.y * -0.45}px)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/wNwzlleA6uzU0Xk7TO32UzbNQA-13.png"
          alt="Waving Hand"
          width={256}
          height={256}
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      {/* Additional visual elements for life */}
      <div
        className="absolute bottom-[10%] left-[8%] w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] lg:bottom-[8%] lg:left-[calc(50%-600px)] lg:w-[120px] lg:h-[120px] transition-transform duration-300 ease-out z-30"
        style={{
          transform: `translate(${mousePosition.x * 0.4}px, ${mousePosition.y * -0.3}px) rotate(-15deg)`,
        }}
      >
        <div className="text-[50px] lg:text-[80px] drop-shadow-lg">🐻</div>
      </div>

      {/* Second girl positioned at bottom right */}
      <div
        className="absolute bottom-[15%] right-[3%] w-[100px] h-[100px] sm:w-[130px] sm:h-[130px] lg:bottom-[12%] lg:right-[calc(50%-580px)] lg:w-[180px] lg:h-[180px] transition-transform duration-300 ease-out z-20"
        style={{
          transform: `translate(${mousePosition.x * -0.2}px, ${mousePosition.y * 0.1}px) rotate(5deg)`,
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/girl2.png"
            alt="Another college mentor"
            width={200}
            height={200}
            className="object-cover rounded-2xl w-full h-full border-4 border-white shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            priority
          />
        </div>
      </div>

      {/* Heart for dating/drama vibe */}
      <div
        className="absolute bottom-[25%] left-[10%] w-[60px] h-[60px] sm:w-[80px] sm:h-[80px] lg:bottom-[20%] lg:left-[calc(50%-400px)] lg:w-[120px] lg:h-[120px] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -0.3}px, ${mousePosition.y * 0.2}px) rotate(15deg)`,
        }}
      >
        <div className="text-[60px] lg:text-[80px] drop-shadow-lg">💖</div>
      </div>

      {/* Main Content - Brutalist Typography */}
      <div className="relative z-30 container mx-auto h-full flex flex-col items-center justify-center text-center px-5">
        {/* Bold headline with shadow layers */}
        <div className="relative">
          <h1 className="font-black text-white leading-[0.8] lowercase text-[5rem] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] tracking-tighter drop-shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
            wizzmo
          </h1>
          <h1 className="absolute top-2 left-2 font-black text-black/20 leading-[0.8] lowercase text-[5rem] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] tracking-tighter -z-10">
            wizzmo
          </h1>
        </div>
        
        <div className="mt-8 relative">
          <p className="max-w-2xl text-white font-bold text-xl md:text-2xl tracking-wide">
            ask a girl.
          </p>
        </div>

        <div className="mt-16 flex flex-col sm:flex-row items-center gap-8">
          <a
            href="https://apps.apple.com/app/wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-block bg-white text-black font-black uppercase tracking-widest px-12 py-5 text-lg border-4 border-white hover:bg-black hover:text-white transition-all duration-300 transform hover:scale-110 shadow-[0_12px_24px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-10"
          >
            GET THE APP
          </a>
          
        </div>
      </div>

      {/* Jagged bottom edge instead of curved */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden">
        <svg 
          className="relative block w-full h-24" 
          xmlns="http://www.w3.org/2000/svg" 
          viewBox="0 0 1200 120" 
          preserveAspectRatio="none"
        >
          <polygon 
            fill="#000000" 
            points="0,120 200,60 400,100 600,40 800,80 1000,20 1200,60 1200,120 0,120"
          />
        </svg>
      </div>
    </section>
  );
};
export default HeroSection;