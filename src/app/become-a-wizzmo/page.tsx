"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function BecomeAWizzmoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    classYear: '',
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
                   formData.university && formData.classYear && formData.whyMentor && formData.confirmAdvice && formData.confirmWoman;

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
          university: formData.university,
          year: formData.classYear,
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

  // Redirect to download page after celebration
  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        window.location.href = '/download'; // Redirect to download page
      }, 3000); // 3 seconds to see celebration

      return () => clearTimeout(timer);
    }
  }, [submitted]);

  // Celebration screen
  if (submitted) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 animate-bounce">
            <Image src="/icon.png" alt="Wizzmo" width={96} height={96} className="rounded-2xl" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">🎉 You're In! 🎉</h1>
          <p className="text-white/90 text-lg">We'll get back to you ASAP!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white lg:bg-gray-50 overflow-hidden">
      <div className="lg:grid lg:grid-cols-2 h-full">
        
        {/* Left Side - Info (hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:bg-gradient-to-br lg:from-[#FF4DB8] lg:to-[#8B5CF6]">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <Image src="/icon.png" alt="Wizzmo" width={80} height={80} className="rounded-2xl mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white">become a wizzmo mentor</h1>
            </div>
            
            <div className="space-y-4 text-white/90">
              <p className="text-lg">💕 help fellow georgetown women</p>
              <p className="text-lg">🌟 build leadership skills</p> 
              <p className="text-lg">🤝 join the hoya community</p>
            </div>
            
            <div className="mt-8 p-4 bg-white/20 rounded-lg">
              <p className="text-white/90 text-sm text-center">
                Starting at Georgetown University.<br/>
                <em>Think Facebook, but for Georgetown.</em>
              </p>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="h-full overflow-y-auto px-6 py-4 lg:py-12 lg:px-8 flex flex-col">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            
            {/* Mobile header */}
            <div className="lg:hidden text-center mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Image src="/icon.png" alt="Wizzmo" width={40} height={40} className="rounded-xl" />
                <h1 className="text-2xl font-bold text-gray-900">Become a Mentor</h1>
              </div>
              <p className="text-gray-600 text-sm">Starting at Georgetown University</p>
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
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white"
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
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white"
                    placeholder="Last name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email (for Google login)</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white"
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                  <input
                    type="text"
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white"
                    placeholder="Georgetown University"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Class Year</label>
                  <input
                    type="text"
                    name="classYear"
                    value={formData.classYear}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white"
                    placeholder="2025"
                    required
                  />
                </div>
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white resize-none"
                  placeholder="I'd make a good mentor because..."
                  required
                />
              </div>

              <div className="space-y-3">
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
                    I understand I must be willing to advise from a <strong>college girl perspective</strong>.
                  </label>
                </div>

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
                    I understand this is <strong>peer advice</strong>, not therapy.
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
              We'll get back to you ASAP!
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}