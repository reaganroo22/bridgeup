"use client";

import React, { useEffect, useState } from 'react';
import Image from "next/image";

const topics = [
  { name: "Dating", emoji: "💕", color: "#FF4DB8" },
  { name: "Drama Talk", emoji: "☕", color: "#8B5CF6" },
  { name: "Matchmaking", emoji: "💫", color: "#C147E9" },
  { name: "Classes", emoji: "📚", color: "#FF6B9D" },
  { name: "Roommates", emoji: "🏠", color: "#9F70FD" },
  { name: "Style", emoji: "✨", color: "#FF5A8A" },
  { name: "Wellness", emoji: "🌸", color: "#B44FE0" },
  { name: "Other", emoji: "💭", color: "#A855F7" },
];

const TopicCard = ({ title, emoji, color }: { title: string; emoji: string; color: string }) => {
  const handleTopicClick = () => {
    // Open the app with deep link to specific topic
    const appUrl = `wizzmo://topics/${title.toLowerCase().replace(' ', '-')}`;
    const fallbackUrl = "https://apps.apple.com/app/wizzmo";
    
    // Try to open the app
    window.location.href = appUrl;
    
    // Fallback to app store after a delay
    setTimeout(() => {
      window.open(fallbackUrl, '_blank');
    }, 1000);
  };

  return (
    <div 
      className="group relative bg-white rounded-none p-6 flex flex-col items-center justify-center aspect-square transition-all duration-300 ease-out hover:scale-110 cursor-pointer border-4 border-transparent hover:border-black hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none"
      onClick={handleTopicClick}
      style={{
        background: `linear-gradient(135deg, white 0%, ${color}15 100%)`
      }}
    >
      <div className="text-4xl mb-3 group-hover:scale-125 transition-transform duration-300">
        {emoji}
      </div>
      <h3 className="text-black font-black text-xl md:text-2xl lowercase text-center leading-tight tracking-tight group-hover:text-white transition-colors duration-300 relative z-20">
        {title}
      </h3>
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-25 transition-opacity duration-300 rounded-none"
        style={{ background: color }}
      />
    </div>
  );
};

const TopicsGrid = () => {
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
    <section className="relative py-16 md:py-24 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] overflow-hidden">
      {/* Floating mentor photo - girl4 */}
      <div
        className="absolute top-[20%] right-[8%] md:right-[5%] w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 transition-transform duration-400 ease-out z-10"
        style={{
          transform: `translate(${mousePosition.x * -0.2}px, ${mousePosition.y * 0.3}px) rotate(10deg)`,
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/girl4.jpeg"
            alt="Mentor exploring topics"
            width={160}
            height={160}
            className="object-cover rounded-3xl border-4 border-white shadow-[0_20px_40px_rgba(0,0,0,0.3)] w-full h-full"
          />
          <div className="absolute -top-2 -right-2 bg-white text-black text-xs px-2 py-1 rounded-full font-black">
            ASK!
          </div>
        </div>
      </div>


      <div className="container relative">
        <div className="relative text-center mb-16">
          <h2 className="font-black text-[4rem] md:text-[6rem] text-white lowercase text-center leading-none tracking-tighter drop-shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            explore topics
          </h2>
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="w-8 h-1 bg-white"></div>
            <p className="text-white/90 font-bold text-lg lowercase tracking-wide">
              tap any topic to dive into the app
            </p>
            <div className="w-8 h-1 bg-white"></div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto">
          {topics.map((topic) => (
            <TopicCard 
              key={topic.name} 
              title={topic.name} 
              emoji={topic.emoji}
              color={topic.color}
            />
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-white/80 font-medium text-lg">
            Can't find your topic? Ask about anything in the app!
          </p>
          <a
            href="https://apps.apple.com/app/wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-6 bg-black text-white font-black uppercase tracking-wider px-8 py-4 border-4 border-black hover:bg-white hover:text-black hover:border-white transition-all duration-300 shadow-[0_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 hover:shadow-none"
          >
            Get the App
          </a>
        </div>
      </div>
    </section>
  );
};

export default TopicsGrid;