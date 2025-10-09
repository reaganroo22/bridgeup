"use client";

import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5 text-center">
          <h1 className="font-display font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            privacy policy
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            How we protect and handle your information on Wizzmo.
          </p>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-20">
        <div className="container mx-auto px-5 max-w-4xl">
          <div className="prose prose-lg prose-invert max-w-none">

            <p className="text-white/80 text-sm mb-8">
              <strong>Effective Date:</strong> September 26, 2025<br />
              <strong>Last Updated:</strong> September 26, 2025
            </p>

            <div className="space-y-12">

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">1. information we collect</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  We collect information to provide and improve our service:
                </p>
                <ul className="text-white/80 space-y-2 ml-6">
                  <li>• <strong>Account Information:</strong> Email, age verification, and basic profile details</li>
                  <li>• <strong>Usage Data:</strong> How you interact with the app, questions asked, and advice given</li>
                  <li>• <strong>Device Information:</strong> Device type, operating system, and app version</li>
                  <li>• <strong>Communications:</strong> Messages between users and support interactions</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">2. how we use your information</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Your information helps us:
                </p>
                <ul className="text-white/80 space-y-2 ml-6">
                  <li>• Connect you with appropriate mentors and advice</li>
                  <li>• Maintain a safe and supportive community</li>
                  <li>• Improve our features and user experience</li>
                  <li>• Verify mentor qualifications and authenticity</li>
                  <li>• Provide customer support</li>
                  <li>• Comply with legal requirements</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">3. anonymity and privacy</h2>
                <p className="text-white/80 leading-relaxed">
                  We take your privacy seriously. Questions are submitted anonymously, and we use advanced techniques to protect user identities. However, we may need to identify users in cases of harmful or illegal activity to ensure community safety.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">4. information sharing</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  We do not sell your personal information. We may share information:
                </p>
                <ul className="text-white/80 space-y-2 ml-6">
                  <li>• With verified mentors to provide relevant advice (anonymously)</li>
                  <li>• With service providers who help us operate the app</li>
                  <li>• When required by law or to protect user safety</li>
                  <li>• In connection with a business transfer or acquisition</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">5. data security</h2>
                <p className="text-white/80 leading-relaxed">
                  We implement industry-standard security measures to protect your information, including encryption, secure servers, and regular security audits. However, no system is completely secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">6. your rights</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  You have the right to:
                </p>
                <ul className="text-white/80 space-y-2 ml-6">
                  <li>• Access and review your personal information</li>
                  <li>• Request corrections to inaccurate information</li>
                  <li>• Delete your account and associated data</li>
                  <li>• Opt out of certain communications</li>
                  <li>• Request a copy of your data</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">7. children's privacy</h2>
                <p className="text-white/80 leading-relaxed">
                  Wizzmo is intended for users 18 and older or those with parental consent. We do not knowingly collect information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">8. international users</h2>
                <p className="text-white/80 leading-relaxed">
                  Wizzmo operates primarily in the United States. By using our service, you consent to the transfer and processing of your information in the United States, which may have different privacy laws than your country.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">9. changes to this policy</h2>
                <p className="text-white/80 leading-relaxed">
                  We may update this Privacy Policy to reflect changes in our practices or legal requirements. We will notify you of significant changes through the app or email.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">10. contact us</h2>
                <p className="text-white/80 leading-relaxed">
                  If you have questions about this Privacy Policy or how we handle your information, please contact us at{" "}
                  <a href="mailto:privacy@wizzmo.app" className="text-[#FF4DB8] hover:text-[#FF6BCC] transition-colors">
                    privacy@wizzmo.app
                  </a>
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