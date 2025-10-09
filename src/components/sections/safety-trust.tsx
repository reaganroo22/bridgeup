import React from 'react';

const SafetyTrustSection = () => {
  return (
    <section id="trust" className="relative w-full bg-background text-foreground py-20 md:py-32">
      <div className="container mx-auto text-center">
        <h2 className="font-display text-[3rem] md:text-[4rem] font-bold leading-none lowercase">
          feel safe. feel seen.
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-white/80">
          Wizzmo is built on kindness and privacy. Ask anonymously. Get advice from verified
          college girls. No judgment—just real support.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xl font-bold lowercase">verified mentors</p>
            <p className="mt-2 text-white/80">We review mentor profiles so you get trusted, experience-backed takes.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xl font-bold lowercase">anonymous questions</p>
            <p className="mt-2 text-white/80">Ask safely without names attached—share what you really think and feel.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-xl font-bold lowercase">kindness first</p>
            <p className="mt-2 text-white/80">We moderate for positivity. No toxicity, no drama—just helpful advice.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SafetyTrustSection;