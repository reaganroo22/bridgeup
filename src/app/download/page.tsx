import Image from "next/image";

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Image src="/icon.png" alt="Wizzmo" width={120} height={120} className="rounded-3xl mx-auto mb-6" />
          <h1 className="text-4xl font-bold text-white mb-4">Download Wizzmo Now!</h1>
          <p className="text-white/90 text-lg mb-8">Your mentor journey starts here</p>
        </div>
        
        <div className="space-y-4">
          <a
            href="https://apps.apple.com/app/wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Image 
              src="/app-store-badge.svg" 
              alt="Download on App Store" 
              width={200} 
              height={60} 
              className="mx-auto hover:scale-105 transition-transform"
            />
          </a>
          
          <a
            href="https://play.google.com/store/apps/details?id=com.wizzmo"
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Image 
              src="/google-play-badge.svg" 
              alt="Get it on Google Play" 
              width={200} 
              height={60} 
              className="mx-auto hover:scale-105 transition-transform"
            />
          </a>
        </div>
        
        <div className="mt-8">
          <a
            href="/"
            className="text-white/80 hover:text-white text-sm underline"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}