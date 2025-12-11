"use client";

import { useState } from "react";
import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";

export default function SafetyPage() {
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState({
    reportType: '',
    description: '',
    contactEmail: ''
  });

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Send email to safety@wizzmo.app
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportData.reportType,
          description: reportData.description,
          contactEmail: reportData.contactEmail,
          timestamp: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Report submitted successfully. Our team will review it within 24 hours.');
        setShowReportForm(false);
        setReportData({ reportType: '', description: '', contactEmail: '' });
      } else {
        alert('Failed to submit report. Please try again or contact safety@wizzmo.app directly.');
      }
    } catch (error) {
      alert('Failed to submit report. Please try again or contact safety@wizzmo.app directly.');
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5 text-center">
          <h1 className="font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            actually safe space
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Real advice from verified college girls in a truly safe environment.
          </p>
        </div>
      </section>

      {/* Safety Features */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-black lowercase text-white text-center mb-16">what makes it actually safe</h2>

            <div className="grid gap-8">
              <div className="bg-white/5 border-4 border-white/20 rounded-none p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🔒</div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-3 lowercase">totally anonymous</h3>
                    <p className="text-white/80 leading-relaxed">
                      Ask anything without your name attached. Your secrets stay secret. We've designed our system to protect your identity
                      completely while still connecting you with relevant advice. Zero personal info required.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border-4 border-white/20 rounded-none p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">✅</div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-3 lowercase">verified college girls only</h3>
                    <p className="text-white/80 leading-relaxed">
                      Every mentor is verified as a real college student. We verify through university emails and backgrounds
                      to ensure our community is authentic and trustworthy. No fake profiles, no catfish, no grown men pretending to be college girls.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border-4 border-white/20 rounded-none p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🚫</div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-3 lowercase">zero tolerance for bs</h3>
                    <p className="text-white/80 leading-relaxed">
                      We kick out toxic people fast. Instant bans for harassment, inappropriate content, or harmful advice.
                      This isn't Reddit. We actively monitor and moderate to maintain a positive environment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 border-4 border-white/20 rounded-none p-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">🛡️</div>
                  <div>
                    <h3 className="text-xl font-black text-white mb-3 lowercase">secure by default</h3>
                    <p className="text-white/80 leading-relaxed">
                      Industry-standard encryption, secure servers, and regular security audits protect your data.
                      Your personal information is never shared without explicit consent. Privacy first, always.
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
              <div className="bg-white/5 border-4 border-white/20 rounded-none p-8">
                <h3 className="text-xl font-bold text-white mb-4 lowercase">report inappropriate content</h3>
                <p className="text-white/80 leading-relaxed mb-4">
                  If you see content that violates our guidelines, please report it immediately. Every report is reviewed
                  by our moderation team within 24 hours.
                </p>
                <button 
                  onClick={() => setShowReportForm(true)}
                  className="bg-[#FF4DB8] text-white px-6 py-3 rounded-full font-medium hover:bg-[#FF6BCC] transition-colors"
                >
                  Report Content
                </button>
              </div>

              <div className="bg-white/5 border-4 border-white/20 rounded-none p-8">
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

      {/* Report Form Modal */}
      {showReportForm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-white/20 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6 lowercase">report inappropriate content</h3>
            
            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div>
                <label className="block text-white font-medium mb-2">Type of Report *</label>
                <select
                  value={reportData.reportType}
                  onChange={(e) => setReportData({...reportData, reportType: e.target.value})}
                  required
                  className="w-full p-3 bg-black/50 border border-white/20 rounded text-white"
                >
                  <option value="">Select report type</option>
                  <option value="harassment">Harassment or Bullying</option>
                  <option value="inappropriate">Inappropriate Content</option>
                  <option value="spam">Spam or Fake Content</option>
                  <option value="safety">Safety Concerns</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Description *</label>
                <textarea
                  value={reportData.description}
                  onChange={(e) => setReportData({...reportData, description: e.target.value})}
                  required
                  placeholder="Please describe the issue in detail..."
                  rows={4}
                  className="w-full p-3 bg-black/50 border border-white/20 rounded text-white placeholder-white/50"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Your Email (Optional)</label>
                <input
                  type="email"
                  value={reportData.contactEmail}
                  onChange={(e) => setReportData({...reportData, contactEmail: e.target.value})}
                  placeholder="For follow-up (optional)"
                  className="w-full p-3 bg-black/50 border border-white/20 rounded text-white placeholder-white/50"
                />
                <p className="text-white/60 text-sm mt-1">
                  Providing your email helps us follow up if needed, but it's optional.
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#FF4DB8] text-white py-3 rounded-full font-medium hover:bg-[#FF6BCC] transition-colors"
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowReportForm(false)}
                  className="flex-1 bg-white/10 text-white py-3 rounded-full font-medium hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}