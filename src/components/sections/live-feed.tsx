"use client";

import React, { useEffect, useState } from 'react';
import Image from "next/image";

const examples = [
  {
    q: "How do I tell my situationship I want something real?",
    a: "Just be straight up! Say 'I really like what we have and want to see where it goes.' If they're not feeling it, at least you'll know.",
    tag: "Dating",
    mentor: "Sarah, 21",
    likes: 47
  },
  {
    q: "My roommate keeps inviting her bf over without asking...",
    a: "Time for a roommate meeting! Set some ground rules together about overnight guests. Communication is key here.",
    tag: "Roommates", 
    mentor: "Maya, 20",
    likes: 32
  },
  {
    q: "Is it weird to eat alone in the dining hall?",
    a: "Girl, no! I do it all the time. Bring headphones, scroll TikTok, and own your space. You're living your best life.",
    tag: "Social",
    mentor: "Zoe, 22", 
    likes: 89
  },
  {
    q: "Should I switch my major if I'm not passionate about it?",
    a: "Passion is overrated honestly. Pick something practical that you're good at and you can build passion along the way.",
    tag: "Classes",
    mentor: "Alex, 21",
    likes: 156
  },
  {
    q: "How do I make friends when everyone already has groups?",
    a: "Join clubs! Everyone's looking for new people there. Also, be the person who invites others to do stuff first.",
    tag: "Social", 
    mentor: "Jess, 19",
    likes: 203
  },
  {
    q: "My parents keep asking about my grades but I'm struggling...",
    a: "Be honest about what's hard. Most parents want to help, not judge. Ask your prof for extensions if needed too.",
    tag: "Classes",
    mentor: "Riley, 20", 
    likes: 78
  },
];

const Bubble = ({ q, a, tag, mentor, likes, index }: { 
  q: string; 
  a: string; 
  tag: string; 
  mentor: string; 
  likes: number;
  index: number;
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  
  const handleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount(prev => prev + 1);
    }
  };

  return (
    <div className="group bg-white text-black rounded-none p-6 shadow-[0_6px_20px_rgba(0,0,0,0.2)] max-w-sm w-full border-4 border-gray-200 hover:border-black hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 hover:scale-102">
      <div className="flex items-center justify-between mb-4">
        <div className="inline-block bg-gradient-to-r from-[#FF4DB8] to-[#8B5CF6] text-white px-3 py-1 text-xs font-black uppercase tracking-wide rounded-none">
          {tag}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLike}
            className={`transition-all duration-200 ${isLiked ? 'text-red-500 scale-125' : 'text-gray-400 hover:text-red-400'}`}
          >
            ❤️
          </button>
          <span className="text-xs font-bold text-gray-600">{likeCount}</span>
        </div>
      </div>
      
      <p className="font-bold leading-tight text-lg mb-3 text-black">"{q}"</p>
      <p className="text-black/80 leading-relaxed font-medium mb-4">— {a}</p>
      
      <div className="flex items-center justify-between pt-3 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">✓</span>
          </div>
          <span className="text-sm font-bold text-gray-700">{mentor}</span>
        </div>
        <span className="text-xs text-gray-500 uppercase tracking-wide">verified</span>
      </div>
    </div>
  );
};

const LiveFeed = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [visibleCards, setVisibleCards] = useState(3);

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

  const showMoreCards = () => {
    setVisibleCards(examples.length);
  };

  return (
    <section
      id="examples"
      className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-bl from-[#FF4DB8] via-[#C147E9] to-[#8B5CF6] py-24 px-6 md:py-32 md:px-12"
    >
      {/* Floating mentor photo in live feed - girl5 (different from hero) */}
      <div
        className="absolute top-[18%] left-[2%] md:left-[5%] w-28 h-28 md:w-36 md:h-36 transition-transform duration-350 ease-out z-10"
        style={{
          transform: `translate(${mousePosition.x * 0.25}px, ${mousePosition.y * 0.15}px) rotate(-12deg)`,
        }}
      >
        <div className="relative w-full h-full">
          <Image
            src="/girl5.png"
            alt="Mentor answering live questions"
            width={144}
            height={144}
            className="object-cover rounded-3xl border-4 border-white shadow-[0_20px_40px_rgba(0,0,0,0.4)] w-full h-full"
          />
          <div className="absolute -top-2 -left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-black animate-pulse">
            LIVE
          </div>
        </div>
      </div>


      <div className="container relative">
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <h2 className="text-[4rem] md:text-[6rem] font-black text-white lowercase leading-none tracking-tighter drop-shadow-[0_6px_24px_rgba(0,0,0,0.3)]">
              live feed
            </h2>
          </div>
          <p className="mt-6 text-white/90 text-xl font-bold max-w-2xl mx-auto">
            Real questions. Real answers. Real college girls helping you with all your drama.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 place-items-center max-w-6xl mx-auto">
          {examples.slice(0, visibleCards).map((example, i) => (
            <Bubble 
              key={i} 
              q={example.q} 
              a={example.a} 
              tag={example.tag} 
              mentor={example.mentor}
              likes={example.likes}
              index={i}
            />
          ))}
        </div>

        {visibleCards < examples.length && (
          <div className="text-center mt-12">
            <button
              onClick={showMoreCards}
              className="bg-white text-black font-black uppercase tracking-wider px-10 py-4 border-4 border-white hover:bg-black hover:text-white hover:border-black transition-all duration-300 shadow-[0_8px_0px_0px_rgba(255,255,255,1)] hover:translate-y-2 hover:shadow-none"
            >
              Show More Live Advice
            </button>
          </div>
        )}

        <div className="text-center mt-16">
          <p className="text-white/80 font-bold text-lg mb-6">
            Want to ask your own question or give advice?
          </p>
          <a
            href="https://apps.apple.com/app/wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-black text-white font-black uppercase tracking-widest px-12 py-5 border-4 border-black hover:bg-white hover:text-black hover:border-white transition-all duration-300 shadow-[0_10px_0px_0px_rgba(0,0,0,1)] hover:translate-y-2 hover:shadow-none text-lg"
          >
            Join the Community
          </a>
        </div>
      </div>
    </section>
  );
};

export default LiveFeed;