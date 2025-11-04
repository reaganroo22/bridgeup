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
    <header className={`fixed top-2 left-4 right-4 md:top-4 md:left-8 md:right-8 lg:left-16 lg:right-16 xl:left-24 xl:right-24 z-50 transition-all duration-500 rounded-full ${
      scrolled
        ? 'bg-background/98 backdrop-blur-xl border border-white/30 shadow-2xl shadow-purple-500/20'
        : 'bg-background/70 backdrop-blur-sm border border-white/10 shadow-xl shadow-black/30'
    }`}>
      <div className={`flex items-center justify-between px-8 md:px-16 lg:px-20 transition-all duration-500 ${
        scrolled ? 'h-12' : 'h-20'
      }`}>
        <Link href="/">
          <Image
            src="/wizzmo-logo.svg"
            alt="Wizzmo Logo"
            width={87}
            height={48}
            className={`w-auto transition-all duration-500 hover:scale-110 ${
              scrolled ? 'h-6' : 'h-12'
            }`}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-x-8">
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.href}
              className="text-foreground/80 font-medium text-[16px] transition-all duration-300 hover:text-foreground hover:scale-110 hover:bg-white/5 px-3 py-2 rounded-lg"
              target={item.href.startsWith('http') ? '_blank' : undefined}
              rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {item.name}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-x-5">
          <a
            href="#cta"
            className="transition-all duration-300 hover:scale-110 hover:shadow-lg animate-pulse hover:animate-none"
          >
            <Image
              src="/app-store-badges.svg"
              alt="Download Wizzmo"
              width={140}
              height={22}
              className="drop-shadow-md"
            />
          </a>
        </div>

        <div className="md:hidden">
          <button aria-label="Open menu" className="p-2">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
