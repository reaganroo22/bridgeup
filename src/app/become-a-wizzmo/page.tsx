"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BecomeAWizzmoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    whyMentor: '',
    confirmAdvice: false,
    confirmWoman: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const canSubmit = formData.firstName && formData.lastName && formData.email && 
                   formData.whyMentor && formData.confirmAdvice && formData.confirmWoman;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/mentor-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          whyJoin: formData.whyMentor,
          university: 'To be provided during onboarding',
          year: 'To be provided',
          major: 'To be provided',
          experience: formData.whyMentor,
          topics: ['General Mentoring'],
          instagram: '',
          referral: ''
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Redirect to App Store after celebration
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        window.open('https://apps.apple.com/app/wizzmo/id123456789', '_blank');
        window.location.href = '/'; // Redirect to home page
      }, 4000); // 4 seconds to see celebration

      return () => clearTimeout(timer);
    }
  }, [submitted]);

  // Celebration screen with App Store redirect
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center animate-bounce">
            <Image src="/icon.png" alt="Wizzmo" width={48} height={48} className="rounded-lg" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">🎉 You're In! 🎉</h1>
          <p className="text-white/90 text-lg mb-6">We'll review your application and get back to you ASAP!</p>
          <div className="bg-white/20 rounded-lg p-4 mb-6">
            <p className="text-white text-sm">Redirecting to App Store in a moment...</p>
          </div>
          <Image src="/app-store-badge.svg" alt="Download on App Store" width={160} height={48} className="mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50">
      <div className="lg:grid lg:grid-cols-2 lg:min-h-screen">
        
        {/* Left Side - Info (hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:bg-gradient-to-br lg:from-[#FF4DB8] lg:to-[#8B5CF6]">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-8">
              <Image src="/icon.png" alt="Wizzmo" width={48} height={48} className="rounded-lg" />
              <h1 className="text-3xl font-bold text-white">Become a Wizzmo Mentor</h1>
            </div>
            
            <div className="space-y-6 text-white/90">
              <div className="flex items-start gap-4">
                <div className="text-2xl">💕</div>
                <div>
                  <h3 className="font-semibold mb-2">Help Fellow Women</h3>
                  <p className="text-sm">Support other college women through the ups and downs of university life.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="text-2xl">🌟</div>
                <div>
                  <h3 className="font-semibold mb-2">Build Leadership Skills</h3>
                  <p className="text-sm">Develop mentoring and communication abilities that will benefit your career.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="text-2xl">🤝</div>
                <div>
                  <h3 className="font-semibold mb-2">Join a Community</h3>
                  <p className="text-sm">Connect with like-minded women who care about helping others succeed.</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-white/20 rounded-lg">
              <p className="text-white/90 text-sm">
                <strong>What we're looking for:</strong><br/>
                College women who want to share advice and support other students through peer guidance.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="flex flex-col justify-center px-6 py-12 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Image src="/icon.png" alt="Wizzmo" width={32} height={32} className="rounded-lg" />
                <h1 className="text-2xl font-bold text-gray-900">Become a Mentor</h1>
              </div>
              <p className="text-gray-600 text-sm">Help fellow college women with peer advice</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base"
                    placeholder="First name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">College Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base"
                  placeholder="you@university.edu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why would you make a good mentor? <span className="text-gray-500">(2-3 sentences)</span>
                </label>
                <textarea
                  name="whyMentor"
                  value={formData.whyMentor}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base resize-none"
                  placeholder="I'd make a good mentor because..."
                  required
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="confirmAdvice"
                    checked={formData.confirmAdvice}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-[#FF4DB8] border-gray-300 rounded focus:ring-[#FF4DB8]"
                    required
                  />
                  <label className="text-sm text-gray-700">
                    I understand this is <strong>peer advice</strong>, not therapy or professional counseling.
                  </label>
                </div>

                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="confirmWoman"
                    checked={formData.confirmWoman}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-[#FF4DB8] border-gray-300 rounded focus:ring-[#FF4DB8]"
                    required
                  />
                  <label className="text-sm text-gray-700">
                    I am a <strong>woman</strong> currently enrolled in college.
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="w-full bg-[#FF4DB8] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#FF6BCC] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>

            <p className="text-gray-500 text-center text-xs mt-6">
              We'll review your application and get back to you ASAP!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}