"use client";

import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] relative overflow-hidden">
        <div className="container mx-auto px-5 text-center relative z-10">
          <h1 className="font-display font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            about wizzmo
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            The college advice app built by students, for students.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white mb-8">our mission</h2>
            <p className="text-white/80 text-lg md:text-xl leading-relaxed">
              College can be overwhelming. Between dating drama, academic stress, roommate conflicts, and social pressures,
              students need real advice from people who truly understand. That's where Wizzmo comes in.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white mb-6 lowercase">real advice, real experiences</h3>
              <p className="text-white/80 leading-relaxed mb-6">
                Wizzmo connects you with verified college students who've been through it all. Our mentors aren't professionals
                with textbook answers—they're your peers who understand the unique challenges of college life today.
              </p>
              <p className="text-white/80 leading-relaxed">
                Whether you're navigating a complicated situationship, dealing with a difficult roommate, or just need someone
                to tell you that your outfit choice is questionable, Wizzmo has you covered.
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">💭</div>
              <h4 className="text-xl font-bold text-white mb-4 lowercase">anonymous & safe</h4>
              <p className="text-white/80">
                Ask your most embarrassing questions without judgment. Our anonymous system protects your privacy while connecting you with helpful advice.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How We're Different */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-5">
          <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">how we're different</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-background border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-white mb-4 lowercase">verified mentors</h3>
              <p className="text-white/80">
                All our advice-givers are verified college students. No fake profiles, no random internet strangers—just real students helping real students.
              </p>
            </div>

            <div className="bg-background border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-4 lowercase">relevant topics</h3>
              <p className="text-white/80">
                From dating and relationships to academics and social life, we focus on what actually matters to college students right now.
              </p>
            </div>

            <div className="bg-background border border-white/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-4">💕</div>
              <h3 className="text-xl font-bold text-white mb-4 lowercase">kind community</h3>
              <p className="text-white/80">
                We're building a supportive space where kindness comes first. No trolling, no judgment—just genuine help and encouragement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">meet the team</h2>

          <div className="max-w-4xl mx-auto text-center">
            <p className="text-white/80 text-lg leading-relaxed mb-12">
              Wizzmo was created by a team of college students who experienced firsthand the need for better peer support.
              We've been through the late-night roommate drama, the confusing dating situations, and the academic stress.
              Now we're building the platform we wish we'd had.
            </p>

            <div className="bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] rounded-2xl p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-4 lowercase">want to join us?</h3>
              <p className="text-white/90 mb-6">
                We're always looking for passionate college students to join our mentor community.
              </p>
              <a
                href="/become-a-wizzmo"
                className="inline-block bg-white text-black text-lg font-bold rounded-full px-8 py-3 hover:bg-neutral-200 transition-colors transform hover:scale-105"
              >
                Become a Wizzmo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-5">
          <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">our values</h2>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-3 lowercase">authenticity first</h3>
                <p className="text-white/80">
                  We believe in real talk, not sugar-coated advice. Our community values honesty and genuine experiences.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3 lowercase">privacy matters</h3>
                <p className="text-white/80">
                  Your personal information and questions are protected. We've built privacy into every aspect of our platform.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white mb-3 lowercase">inclusive community</h3>
                <p className="text-white/80">
                  Wizzmo welcomes students from all backgrounds. We're committed to creating a space where everyone feels heard and supported.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-3 lowercase">continuous improvement</h3>
                <p className="text-white/80">
                  We're constantly evolving based on user feedback. Our community shapes the direction of our platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}