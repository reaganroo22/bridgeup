"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const navItems = [
  { name: 'About', href: '/about' },
  { name: 'Safety', href: '/safety' },
  { name: 'FAQ', href: '/faq' },
  { name: 'Become a Wizzmo', href: '/become-a-wizzmo' },
  { name: 'Contact us', href: 'mailto:hello@wizzmo.app' },
];

const Navigation = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#FF4DB8]/95 backdrop-blur-lg border-b-4 border-[#8B5CF6] shadow-lg'
        : 'bg-gradient-to-r from-[#FF4DB8] to-[#8B5CF6] shadow-2xl'
    }`}>
      <div className={`flex items-center justify-between px-6 md:px-8 lg:px-12 transition-all duration-300 ${
        scrolled ? 'h-16' : 'h-20'
      }`}>
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/wizzmo.png"
            alt="Wizzmo Bear"
            width={48}
            height={48}
            className={`transition-all duration-300 hover:scale-110 ${
              scrolled ? 'w-10 h-10' : 'w-12 h-12'
            }`}
            priority
          />
          <span className="text-white font-black text-2xl tracking-tight lowercase">
            wizzmo
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-x-6">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-white/90 font-bold text-sm uppercase tracking-wide transition-all duration-200 hover:text-white hover:scale-105 px-3 py-2 border-2 border-transparent hover:border-white/30 rounded-none"
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-x-3">
          <a
            href="https://apps.apple.com/app/wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-all duration-300 hover:scale-105"
          >
            <Image
              src="/app store.png"
              alt="Download on App Store"
              width={120}
              height={36}
              className="drop-shadow-md"
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
            className="transition-all duration-300 hover:scale-105"
          >
            <Image
              src="/google play.png"
              alt="Get it on Google Play"
              width={120}
              height={36}
              className="drop-shadow-md"
            />
          </button>
        </div>

        <div className="md:hidden">
          <button aria-label="Download App" className="bg-white text-[#FF4DB8] px-4 py-2 font-black text-sm uppercase tracking-wide border-2 border-white hover:bg-transparent hover:text-white transition-colors">
            Download
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
