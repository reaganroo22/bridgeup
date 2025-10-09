"use client";

import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5 text-center">
          <h1 className="font-display font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            safety & trust
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Creating a safe space for honest advice and genuine connections.
          </p>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">how we keep you safe</h2>

            <div className="grid gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🔒</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 lowercase">anonymous by design</h3>
                    <p className="text-white/80 leading-relaxed">
                      Your questions are completely anonymous. We've built our system from the ground up to protect your identity
                      while still connecting you with relevant advice. No one can trace questions back to you.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">✅</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 lowercase">verified mentors only</h3>
                    <p className="text-white/80 leading-relaxed">
                      Every mentor goes through a verification process to confirm they're real college students. We check student IDs,
                      university emails, and conduct background reviews to ensure our community is authentic and trustworthy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🛡️</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 lowercase">24/7 content moderation</h3>
                    <p className="text-white/80 leading-relaxed">
                      Our team monitors all interactions to prevent harassment, inappropriate content, and harmful advice.
                      We use both automated systems and human reviewers to maintain a positive environment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📱</div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-3 lowercase">secure platform</h3>
                    <p className="text-white/80 leading-relaxed">
                      We use industry-standard encryption, secure servers, and regular security audits to protect your data.
                      Your personal information is never shared without your explicit consent.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Community Guidelines */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">community guidelines</h2>

            <div className="space-y-8">
              <div className="bg-background border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">be kind and respectful</h3>
                <p className="text-white/80 leading-relaxed">
                  Treat everyone with kindness and respect. We have zero tolerance for bullying, harassment, or discrimination
                  of any kind. Remember that behind every question is a real person looking for help.
                </p>
              </div>

              <div className="bg-background border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">keep it appropriate</h3>
                <p className="text-white/80 leading-relaxed">
                  No explicit content, hate speech, or illegal activities. While we discuss dating and relationships,
                  conversations should remain respectful and appropriate for a college-aged audience.
                </p>
              </div>

              <div className="bg-background border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">protect privacy</h3>
                <p className="text-white/80 leading-relaxed">
                  Don't share personal information like phone numbers, addresses, or social media handles. Keep the conversation
                  within Wizzmo to maintain everyone's safety and privacy.
                </p>
              </div>

              <div className="bg-background border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">give constructive advice</h3>
                <p className="text-white/80 leading-relaxed">
                  Focus on providing helpful, constructive advice based on your genuine experiences. Avoid judgment
                  and remember that what worked for you might not work for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting Section */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">reporting & support</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">report inappropriate content</h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  If you see content that violates our guidelines, please report it immediately. Every report is reviewed
                  by our moderation team within 24 hours.
                </p>
                <button className="bg-[#FF4DB8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#FF6BCC] transition-colors">
                  Report Content
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">need help?</h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  Our support team is here to help with any safety concerns, technical issues, or questions about using Wizzmo safely.
                </p>
                <a
                  href="mailto:safety@wizzmo.app"
                  className="inline-block bg-[#FF4DB8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#FF6BCC] transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crisis Resources */}
      <section className="py-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white mb-8">need immediate help?</h2>
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              While Wizzmo provides peer support, some situations require professional help. If you're experiencing
              a crisis or emergency, please reach out to these resources immediately:
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-left">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Crisis Text Line</h3>
                <p className="text-white/90 font-mono text-lg">Text HOME to 741741</p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">National Suicide Prevention Lifeline</h3>
                <p className="text-white/90 font-mono text-lg">988</p>
              </div>

              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">Emergency Services</h3>
                <p className="text-white/90 font-mono text-lg">911</p>
              </div>
            </div>

            <p className="text-white/80 text-sm mt-8">
              Remember: Wizzmo mentors are peers, not licensed professionals. For serious mental health concerns,
              academic issues, or legal matters, please consult appropriate professionals.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}