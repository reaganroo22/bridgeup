import Image from "next/image";

export default function WhyWizzmoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Image 
            src="/icon.png" 
            alt="Wizzmo" 
            width={80} 
            height={80} 
            className="rounded-2xl mx-auto mb-6" 
          />
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            why become a wizzmo mentor?
          </h1>
          <p className="text-white/90 text-xl max-w-2xl mx-auto">
            Join the movement empowering college women at Georgetown University
          </p>
        </div>

        {/* Benefits Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">💕</div>
            <h3 className="text-xl font-bold text-white mb-2">Help Fellow Hoyas</h3>
            <p className="text-white/80">Guide Georgetown women through their college journey with your experience and wisdom</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🌟</div>
            <h3 className="text-xl font-bold text-white mb-2">Build Leadership Skills</h3>
            <p className="text-white/80">Develop mentorship, communication, and leadership abilities that will serve you for life</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="text-xl font-bold text-white mb-2">Join the Community</h3>
            <p className="text-white/80">Be part of a supportive network of Georgetown women lifting each other up</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">📚</div>
            <h3 className="text-xl font-bold text-white mb-2">Share Your Knowledge</h3>
            <p className="text-white/80">Help others navigate academics, internships, social life, and career planning</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-white mb-2">Make an Impact</h3>
            <p className="text-white/80">Be the mentor you wished you had when you were figuring things out</p>
          </div>

          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-2">Flexible Commitment</h3>
            <p className="text-white/80">Mentor on your own schedule with as much or as little time as you can give</p>
          </div>
        </div>

        {/* Vision Statement */}
        <div className="bg-white/30 backdrop-blur-sm rounded-3xl p-8 mb-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Our Vision</h2>
          <p className="text-white/90 text-lg leading-relaxed max-w-3xl mx-auto">
            Wizzmo is creating a supportive ecosystem where Georgetown women can thrive. 
            Starting at Georgetown University, we're building the foundation for a platform 
            that will expand to empower college women everywhere. Think Facebook for Harvard, 
            but focused on mentorship and community support.
          </p>
        </div>

        {/* Download Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-6">Ready to Get Started?</h2>
          <p className="text-white/90 mb-8">Download the Wizzmo app and start making a difference today</p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                className="hover:scale-105 transition-transform"
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
                className="hover:scale-105 transition-transform"
              />
            </a>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-8">
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