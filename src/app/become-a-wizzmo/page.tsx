"use client";

import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useState } from "react";

export default function BecomeAWizzmoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    year: '',
    major: '',
    whyJoin: '',
    experience: '',
    topics: [] as string[],
    instagram: '',
    referral: ''
  });

  const topicOptions = [
    'Dating & Relationships',
    'Academic Support',
    'Roommate Issues',
    'Social Life',
    'Mental Health',
    'Career Advice',
    'Campus Life',
    'Greek Life',
    'Study Abroad',
    'Internships',
    'Graduate School',
    'Financial Advice'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTopicChange = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your application! We\'ll review it and get back to you soon.');
  };

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5 text-center">
          <h1 className="font-display font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            become a wizzmo
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Help fellow college students navigate their journey with your experience and wisdom.
          </p>
        </div>
      </section>

      {/* Why Become a Mentor */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">why become a mentor?</h2>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">💕</div>
                <h3 className="text-xl font-bold text-white mb-4 lowercase">make a difference</h3>
                <p className="text-white/80">
                  Help fellow students through challenging times and celebrate their successes. Your advice could change someone's college experience.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">🌟</div>
                <h3 className="text-xl font-bold text-white mb-4 lowercase">build leadership skills</h3>
                <p className="text-white/80">
                  Develop your communication, empathy, and mentoring abilities—skills that will benefit you in your career and personal life.
                </p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-bold text-white mb-4 lowercase">join a community</h3>
                <p className="text-white/80">
                  Connect with like-minded students who care about helping others. Be part of building something meaningful.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-white/5">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">what we're looking for</h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 lowercase">current college student</h3>
                    <p className="text-white/80">
                      Must be enrolled in an accredited college or university
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 lowercase">good academic standing</h3>
                    <p className="text-white/80">
                      Maintain a 2.5+ GPA and be in good standing with your institution
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 lowercase">empathetic personality</h3>
                    <p className="text-white/80">
                      Genuine desire to help others with kindness and understanding
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 lowercase">reliable availability</h3>
                    <p className="text-white/80">
                      Commit to responding to questions regularly (at least a few times per week)
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 lowercase">diverse experiences</h3>
                    <p className="text-white/80">
                      Have navigated various aspects of college life and can share meaningful insights
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2 lowercase">positive attitude</h3>
                    <p className="text-white/80">
                      Maintain professionalism and positivity even in challenging conversations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[3rem] md:text-[4rem] font-bold lowercase text-white text-center mb-16">apply to become a mentor</h2>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                    placeholder="Your first name"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                    placeholder="Your last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">University Email *</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                  placeholder="your.name@university.edu"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-white font-medium mb-2">University *</label>
                  <input
                    type="text"
                    name="university"
                    required
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                    placeholder="University of Example"
                  />
                </div>

                <div>
                  <label className="block text-white font-medium mb-2">Year *</label>
                  <select
                    name="year"
                    required
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-[#FF4DB8] focus:outline-none"
                  >
                    <option value="">Select your year</option>
                    <option value="freshman">Freshman</option>
                    <option value="sophomore">Sophomore</option>
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                    <option value="graduate">Graduate Student</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Major *</label>
                <input
                  type="text"
                  name="major"
                  required
                  value={formData.major}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                  placeholder="Your major or field of study"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Topics You'd Like to Mentor In *</label>
                <p className="text-white/60 text-sm mb-4">Select all that apply</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {topicOptions.map((topic) => (
                    <label key={topic} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.topics.includes(topic)}
                        onChange={() => handleTopicChange(topic)}
                        className="w-4 h-4 text-[#FF4DB8] bg-white/10 border-white/20 rounded focus:ring-[#FF4DB8] focus:ring-2"
                      />
                      <span className="text-white/80 text-sm">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Why do you want to become a Wizzmo mentor? *</label>
                <textarea
                  name="whyJoin"
                  required
                  value={formData.whyJoin}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none resize-none"
                  placeholder="Tell us about your motivation to help fellow students..."
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Share a relevant experience *</label>
                <p className="text-white/60 text-sm mb-2">Describe a challenging situation you navigated in college and how you grew from it</p>
                <textarea
                  name="experience"
                  required
                  value={formData.experience}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none resize-none"
                  placeholder="Share your story..."
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">Instagram Handle (Optional)</label>
                <p className="text-white/60 text-sm mb-2">For verification purposes only</p>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                  placeholder="@yourusername"
                />
              </div>

              <div>
                <label className="block text-white font-medium mb-2">How did you hear about Wizzmo?</label>
                <input
                  type="text"
                  name="referral"
                  value={formData.referral}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:border-[#FF4DB8] focus:outline-none"
                  placeholder="Friend, social media, campus event, etc."
                />
              </div>

              <div className="text-center pt-8">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-[#FF4DB8] to-[#8B5CF6] text-white text-lg font-bold rounded-full px-12 py-4 hover:from-[#FF6BCC] hover:to-[#9F7AEA] transition-all transform hover:scale-105"
                >
                  Submit Application
                </button>
                <p className="text-white/60 text-sm mt-4">
                  We'll review your application and get back to you within 5-7 business days.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}