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
      className="relative w-full h-[840px] md:h-[900px] lg:h-[1024px] overflow-hidden bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]"
    >
      {/* Decorative Assets */}
      <div
        className="absolute top-[10%] left-[5%] w-[80px] h-[80px] sm:w-[120px] sm:h-[120px] lg:top-[12%] lg:left-[calc(50%-480px)] lg:w-[188px] lg:h-[188px] animate-wiggle-more animate-infinite animate-duration-[4000ms] transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.35}px, ${mousePosition.y * 0.4}px)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/lb7blSnnkBEQMJ7sQMzXUQo6ok-2.png"
          alt="Waving hand emoji"
          width={256}
          height={256}
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      <div
        className="hidden lg:block absolute top-[6%] right-[calc(50%-380px)] w-[80px] h-[80px] animate-pulse animate-infinite animate-duration-[3000ms] transition-transform duration-150 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -0.15}px, ${mousePosition.y * 0.25}px)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/TASsLHB7JEwwqLO5MBwDgniZ8dE-6.png"
          alt="Heart balloon"
          width={215}
          height={215}
          className="object-contain drop-shadow-lg"
        />
      </div>

      <div
        className="absolute top-[15%] right-[5%] w-[70px] h-[70px] sm:w-[100px] sm:h-[100px] lg:right-[calc(50%-450px)] lg:top-[20%] lg:w-[156px] lg:h-[156px] animate-float animate-infinite animate-duration-[5000ms] transition-transform duration-200 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.6}px, ${mousePosition.y * -0.45}px)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/1ojZwN35M1543O3qePxnuoypA9A-3.png"
          alt="Pink paw keychain"
          width={256}
          height={256}
          className="object-contain drop-shadow-lg"
          priority
        />
      </div>

      <div
        className="absolute bottom-[25%] left-[2%] w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] lg:left-[calc(50%-480px)] lg:bottom-[15%] lg:w-[252px] lg:h-[252px] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.3}px) rotate(-8deg)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/9Zn10awOegDDlupSZubQ1vQ0c-4.png"
          alt="Photo of a person with a basketball"
          width={512}
          height={512}
          className="rounded-[30px] object-cover w-full h-full shadow-2xl"
        />
      </div>

      <div
        className="absolute bottom-[25%] right-[2%] w-[120px] h-[120px] sm:w-[150px] sm:h-[150px] lg:right-[calc(50%-480px)] lg:bottom-[15%] lg:w-[252px] lg:h-[252px] transition-transform duration-250 ease-out"
        style={{
          transform: `translate(${mousePosition.x * -0.5}px, ${mousePosition.y * 0.55}px) rotate(7deg)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/mtsHgzGzFInnpQ5Lmw4GzTyc3ko-5.png"
          alt="Photo of a person"
          width={512}
          height={512}
          className="rounded-[30px] object-cover w-full h-full shadow-2xl"
        />
      </div>

      <div
        className="hidden lg:block absolute bottom-[-4%] left-[calc(50%-180px)] w-[150px] h-[150px] transition-transform duration-180 ease-out"
        style={{
          transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * -0.08}px)`,
        }}
      >
        <Image
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/test-clones/d2c04693-a477-498b-8d7e-7ecdb4498469-ngl-link/assets/images/tw0B8hik79Ts6jROEvasCn290-7.png"
          alt="A drink in a glass with a straw"
          width={512}
          height={512}
          className="object-contain drop-shadow-lg"
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto h-full flex flex-col items-center justify-center text-center px-5">
        <h1 className="font-display font-black text-white leading-none lowercase text-[3.2rem] md:text-[5rem] lg:text-[7.5rem] tracking-tighter">
          wizzmo
        </h1>
        <p className="mt-6 max-w-2xl text-white/90 text-lg md:text-xl">
          life advice from college girls.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <a
            href="#cta"
            className="inline-block bg-white text-black text-button font-bold rounded-full px-8 py-4 hover:bg-neutral-200 transition-colors transform hover:scale-105"
          >
            Download App
          </a>
        </div>
      </div>

      {/* Curved Bottom */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-[200vw] h-[512px] bg-background rounded-t-[50%]"
        style={{ bottom: "-464px" }}
      />
    </section>
  );
};
export default HeroSection;