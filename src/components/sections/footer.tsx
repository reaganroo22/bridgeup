import Image from "next/image";
import Link from "next/link";

const Footer = () => {
  return (
    <footer id="footer" className="w-full bg-black py-20">
      <div className="container flex flex-col items-center justify-center gap-10">
        <Link href="/">
          <Image
            src="/wizzmo-logo.svg"
            alt="Wizzmo Logo"
            width={104}
            height={40}
          />
        </Link>
        <nav className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          <Link href="/about" className="text-base font-medium text-white transition-colors hover:text-white/80">
            About
          </Link>
          <Link href="/safety" className="text-base font-medium text-white transition-colors hover:text-white/80">
            Safety
          </Link>
          <a href="mailto:hello@wizzmo.app" className="text-base font-medium text-white transition-colors hover:text-white/80">
            Contact us
          </a>
          <a href="https://www.instagram.com/wizzmo.app/" target="_blank" rel="noopener noreferrer" className="text-base font-medium text-white transition-colors hover:text-white/80">
            Instagram
          </a>
        </nav>
        <p className="text-center text-sm font-medium tracking-wide text-white/40">
          hello@wizzmo.app
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-2">
          <Link href="/terms-of-service" className="text-sm font-medium tracking-wide text-white/40 transition-colors hover:text-white/60">
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className="text-sm font-medium tracking-wide text-white/40 transition-colors hover:text-white/60">
            Privacy Policy
          </Link>
        </div>
        <p className="text-center text-sm font-medium tracking-wide text-white/40">
          Made with love by Wizzmo ❤
        </p>
      </div>
    </footer>
  );
};

export default Footer;