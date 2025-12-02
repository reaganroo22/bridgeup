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
      className="bg-background text-foreground py-32 md:py-40 overflow-hidden relative"
    >

      <div className="container relative mx-auto px-5 md:px-10">

        {/* Main Content - Simple 1,2,3 flow */}
        <div className="relative z-30 flex flex-col items-center text-center space-y-16">
          <div className="relative">
            <h2 className="text-[3.5rem] md:text-[5rem] font-black lowercase tracking-tighter text-white">
              how it works
            </h2>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-[#FF4DB8]"></div>
          </div>

          {/* Simple 1-2-3 grid */}
          <div className="grid w-full max-w-4xl grid-cols-1 gap-12 md:grid-cols-3 md:gap-8">
            <div className="relative bg-white/5 border-2 border-white/20 rounded-none p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#FF4DB8] flex items-center justify-center border-2 border-white">
                <span className="text-white font-black text-xl">1</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black lowercase text-white mb-4 mt-6 tracking-tight text-center">
                ask anything
              </h3>
              <p className="text-white/90 leading-relaxed font-medium text-center">
                Drop your question anonymously. Dating, roommates, career—anything.
              </p>
            </div>

            <div className="relative bg-white/5 border-2 border-white/20 rounded-none p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#8B5CF6] flex items-center justify-center border-2 border-white">
                <span className="text-white font-black text-xl">2</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black lowercase text-white mb-4 mt-6 tracking-tight text-center">
                get real advice
              </h3>
              <p className="text-white/90 leading-relaxed font-medium text-center">
                College girls share honest advice from experience.
              </p>
            </div>

            <div className="relative bg-white/5 border-2 border-white/20 rounded-none p-8">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#C147E9] flex items-center justify-center border-2 border-white">
                <span className="text-white font-black text-xl">3</span>
              </div>
              <h3 className="text-xl md:text-2xl font-black lowercase text-white mb-4 mt-6 tracking-tight text-center">
                take action
              </h3>
              <p className="text-white/90 leading-relaxed font-medium text-center">
                Get clear direction and move forward.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;