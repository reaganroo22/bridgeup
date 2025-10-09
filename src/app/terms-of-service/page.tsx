"use client";

import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5 text-center">
          <h1 className="font-display font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            terms of service
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Your guide to using Wizzmo responsibly and safely.
          </p>
        </div>
      </section>

      {/* Terms Content */}
      <section className="py-20">
        <div className="container mx-auto px-5 max-w-4xl">
          <div className="prose prose-lg prose-invert max-w-none">

            <p className="text-white/80 text-sm mb-8">
              <strong>Effective Date:</strong> September 26, 2025<br />
              <strong>Last Updated:</strong> September 26, 2025
            </p>

            <div className="space-y-12">

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">1. acceptance of terms</h2>
                <p className="text-white/80 leading-relaxed">
                  By downloading, installing, or using the Wizzmo mobile application ("App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use our App.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">2. description of service</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  Wizzmo is a college advice platform that connects students seeking guidance with verified college mentors. Our service includes:
                </p>
                <ul className="text-white/80 space-y-2 ml-6">
                  <li>• Anonymous question submission</li>
                  <li>• Advice from verified college students</li>
                  <li>• Topic-based guidance on dating, academics, and social life</li>
                  <li>• Community features and interactions</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">3. user eligibility</h2>
                <p className="text-white/80 leading-relaxed">
                  You must be at least 18 years old or have parental consent to use Wizzmo. By using our App, you represent that you meet these age requirements and have the legal capacity to enter into these Terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">4. community guidelines</h2>
                <p className="text-white/80 leading-relaxed mb-4">
                  To maintain a safe and supportive environment, users must:
                </p>
                <ul className="text-white/80 space-y-2 ml-6">
                  <li>• Be respectful and kind in all interactions</li>
                  <li>• Not share personal contact information</li>
                  <li>• Not engage in harassment, bullying, or inappropriate behavior</li>
                  <li>• Not post harmful, illegal, or explicit content</li>
                  <li>• Not impersonate others or create fake accounts</li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">5. content and conduct</h2>
                <p className="text-white/80 leading-relaxed">
                  Users are responsible for their content and conduct on Wizzmo. We reserve the right to remove content or suspend accounts that violate our community guidelines or these Terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">6. privacy and data</h2>
                <p className="text-white/80 leading-relaxed">
                  Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">7. limitation of liability</h2>
                <p className="text-white/80 leading-relaxed">
                  Wizzmo provides a platform for peer advice and support. We are not responsible for the accuracy or consequences of advice given by users. Always use your best judgment and consult appropriate professionals for serious matters.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">8. changes to terms</h2>
                <p className="text-white/80 leading-relaxed">
                  We may update these Terms from time to time. We will notify users of significant changes through the App or via email. Continued use of Wizzmo constitutes acceptance of updated Terms.
                </p>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-4 lowercase">9. contact us</h2>
                <p className="text-white/80 leading-relaxed">
                  If you have questions about these Terms, please contact us at{" "}
                  <a href="mailto:legal@wizzmo.app" className="text-[#FF4DB8] hover:text-[#FF6BCC] transition-colors">
                    legal@wizzmo.app
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