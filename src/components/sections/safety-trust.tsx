"use client";

import React, { useEffect, useState } from 'react';
import Image from "next/image";

const SafetyTrustSection = () => {
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
    <section id="trust" className="relative w-full bg-background text-foreground py-24 md:py-32 overflow-hidden">

      {/* Safety mentor photo - top right enhanced */}
      <div
        className="pointer-events-none absolute top-[10%] right-[3%] w-32 h-32 md:w-44 md:h-44 lg:w-52 lg:h-52 transition-transform duration-300 ease-out z-10"
        style={{
          transform: `translate(${mousePosition.x * -0.2}px, ${mousePosition.y * 0.15}px) rotate(8deg)`,
        }}
      >
        <div className="relative w-full h-full bg-gradient-to-br from-[#FF4DB8]/20 to-[#8B5CF6]/20 p-3 shadow-[0_20px_40px_rgba(0,0,0,0.4)] border-4 border-white transform hover:scale-105 transition-all duration-300 flex items-center justify-center">
          <Image
            src="/wizzmiss.png"
            alt="Wizzmiss - Safe space mascot"
            width={256}
            height={256}
            className="object-contain w-full h-full"
          />
          <div className="absolute -top-2 -left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-black border-2 border-white">
            🛡️ SAFE
          </div>
          <div className="absolute -bottom-1 -right-1 bg-[#FF4DB8] text-white text-xs px-2 py-1 rounded-full font-black border-2 border-white">
            ✓ TRUSTED
          </div>
        </div>
      </div>

      <div className="container mx-auto text-center relative">
        <div className="relative">
          <h2 className="font-black text-[3.5rem] md:text-[5.5rem] leading-none lowercase tracking-tighter text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            actually safe space
          </h2>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-[#FF4DB8]"></div>
        </div>

        <p className="mt-8 max-w-3xl mx-auto text-white/90 text-xl font-bold leading-relaxed">
          Real advice from verified college girls. Here's what keeps it safe.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-8 max-w-6xl mx-auto">
          <div className="group relative bg-white/5 border-4 border-white/20 rounded-none p-8 hover:bg-white/10 transition-all duration-300 hover:border-[#FF4DB8] hover:shadow-[0_0_30px_rgba(255,77,184,0.3)] hover:scale-102">
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-[#FF4DB8] flex items-center justify-center border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.3)]">
              <span className="text-white text-xl">🔒</span>
            </div>
            <h3 className="text-2xl font-black lowercase text-white mb-6 mt-6 tracking-tight">
              totally anonymous
            </h3>
            <p className="text-white/90 leading-relaxed font-medium text-lg">
              Ask anything without your name attached. Your secrets stay secret.
            </p>
            <div className="mt-6 inline-block text-[#FF4DB8] font-bold text-sm uppercase tracking-wide bg-[#FF4DB8]/10 px-3 py-1 border border-[#FF4DB8]/30">
              zero personal info required
            </div>
          </div>

          <div className="group relative bg-white/5 border-4 border-white/20 rounded-none p-8 hover:bg-white/10 transition-all duration-300 hover:border-[#8B5CF6] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:scale-102">
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-[#8B5CF6] flex items-center justify-center border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.3)]">
              <span className="text-white text-xl">✅</span>
            </div>
            <h3 className="text-2xl font-black lowercase text-white mb-6 mt-6 tracking-tight">
              verified college students only
            </h3>
            <p className="text-white/90 leading-relaxed font-medium text-lg">
              Every mentor is verified as a real college student. No fake profiles.
            </p>
            <div className="mt-6 inline-block text-[#8B5CF6] font-bold text-sm uppercase tracking-wide bg-[#8B5CF6]/10 px-3 py-1 border border-[#8B5CF6]/30">
              verified college students
            </div>
          </div>

          <div className="group relative bg-white/5 border-4 border-white/20 rounded-none p-8 hover:bg-white/10 transition-all duration-300 hover:border-[#C147E9] hover:shadow-[0_0_30px_rgba(193,71,233,0.3)] hover:scale-102">
            <div className="absolute -top-2 -left-2 w-12 h-12 bg-[#C147E9] flex items-center justify-center border-2 border-white shadow-[0_6px_20px_rgba(0,0,0,0.3)]">
              <span className="text-white text-xl">🚫</span>
            </div>
            <h3 className="text-2xl font-black lowercase text-white mb-6 mt-6 tracking-tight">
              zero tolerance for bs
            </h3>
            <p className="text-white/90 leading-relaxed font-medium text-lg">
              We kick out toxic people fast. This isn't Reddit.
            </p>
            <div className="mt-6 inline-block text-[#C147E9] font-bold text-sm uppercase tracking-wide bg-[#C147E9]/10 px-3 py-1 border border-[#C147E9]/30">
              instant bans for toxicity
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default SafetyTrustSection;