"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const HowItWorksSection = () => {
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
      id="how-it-works"
      className="bg-background text-foreground py-40 md:py-56 overflow-hidden"
    >
      <div className="container relative mx-auto px-5 md:px-10">
        {/* Decorative Elements - positioned absolutely relative to container */}

        {/* Pizza Image with Face Placeholder */}
        <div
          className="pointer-events-none absolute top-[60%] -left-12 md:left-[-5%] lg:left-0 md:top-[55%] w-36 h-36 md:w-48 md:h-48 -z-10 transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px) rotate(-12deg)`,
          }}
        >
          <div className="relative">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/Ok7TXTFvuZmj5ehhe3vc1x4XDk-8.png"
              alt="Pizza slice"
              width={192}
              height={192}
              className="drop-shadow-lg"
            />
            {/* Face placeholder */}
            <div className="absolute top-2 right-2 w-12 h-12 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Skateboard Image with Face Placeholder */}
        <div
          className="pointer-events-none absolute top-[18%] -right-10 md:right-[-5%] lg:right-0 md:top-[15%] w-28 h-auto md:w-40 -z-10 transition-transform duration-150 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.015}px, ${mousePosition.y * 0.025}px) rotate(12deg)`,
          }}
        >
          <div className="relative">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/PaDEnSWBFP8tLzci1cJn15IMYE-10.png"
              alt="Skateboard"
              width={160}
              height={329}
              className="object-contain drop-shadow-lg"
            />
            {/* Face placeholder */}
            <div className="absolute top-4 left-4 w-10 h-10 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
              <div className="w-6 h-6 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Cloud Image with Face Placeholder */}
        <div
          className="pointer-events-none absolute top-[65%] right-0 md:right-[2%] lg:right-[5%] md:top-[60%] w-40 h-auto md:w-56 -z-10 transition-transform duration-200 ease-out"
          style={{
            transform: `translate(${mousePosition.x * -0.03}px, ${mousePosition.y * -0.01}px)`,
          }}
        >
          <div className="relative">
            <Image
              src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/jdTxRdllkie3eF2vOBncxQwIr4-9.png"
              alt="Cloud"
              width={224}
              height={224}
              className="drop-shadow-lg"
            />
            {/* Face placeholder */}
            <div className="absolute top-6 left-6 w-14 h-14 bg-white/20 rounded-full border-2 border-white/40 flex items-center justify-center backdrop-blur-sm">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-300 to-purple-300 rounded-full shadow-inner"></div>
            </div>
          </div>
        </div>

        {/* Main Text Content */}
        <div className="relative z-30 flex flex-col items-center text-center space-y-16 md:space-y-24">
          <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase">how it works</h2>
          <div className="grid w-full max-w-6xl grid-cols-1 gap-12 md:grid-cols-3 md:gap-16">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-bold lowercase text-white mb-4">1. ask anonymously</h3>
              <p className="text-white/80 leading-relaxed">Drop your question about dating, drama, classes, roommates, or style—no names, no pressure.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-bold lowercase text-white mb-4">2. real takes</h3>
              <p className="text-white/80 leading-relaxed">Verified mentors—actual college girls—share kind, honest advice based on real experience.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
              <h3 className="text-2xl md:text-3xl font-bold lowercase text-white mb-4">3. act confidently</h3>
              <p className="text-white/80 leading-relaxed">Get clarity fast and move with confidence. Save faves, follow mentors, and glow up your social life.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;