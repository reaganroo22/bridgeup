"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import UniversitySearch from "@/components/UniversitySearch";

export default function BecomeAWizzmoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    classYear: '',
    whyMentor: '',
    instagram: '',
    confirmAdvice: false,
    confirmWoman: false
  });

  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const heightDiff = window.innerHeight < window.screen.height * 0.75;
      setKeyboardOpen(heightDiff);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const gradYears = [
    '2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032'
  ];


  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    let processedValue = value;
    
    // Auto-add @ for Instagram handle
    if (name === 'instagram') {
      processedValue = value.startsWith('@') ? value : `@${value}`;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : processedValue
    }));
  };

  const canSubmit = formData.firstName && formData.lastName && formData.email && 
                   formData.university && formData.classYear && formData.whyMentor && formData.instagram && formData.confirmAdvice && formData.confirmWoman;

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
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          whyJoin: formData.whyMentor.trim(),
          university: formData.university,
          year: formData.classYear.toString(),
          major: '',
          experience: formData.whyMentor.trim(),
          topics: ['General College Advice'],
          instagram: formData.instagram.trim(),
          referral: ''
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        // Check if response is JSON or HTML
        const contentType = response.headers.get('content-type');
        let errorData;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            // If it's HTML, get text and show a different error
            const htmlText = await response.text();
            console.error('Received HTML response:', htmlText.substring(0, 500));
            throw new Error('Server returned HTML instead of JSON. The API endpoint may not be working properly.');
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          throw new Error(`Server error (status ${response.status}). Could not parse response.`);
        }
        
        console.error('API Error:', errorData);
        throw new Error(errorData.error || 'Submission failed');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Something went wrong: ${errorMessage}. Please try again.`);
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
          <p className="text-white/90 text-lg">We'll get back to you ASAP! Download the app with the email you provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white lg:bg-gray-50">
      <div className="lg:grid lg:grid-cols-2 h-full">
        
        {/* Left Side - Info (hidden on mobile, shown on desktop) */}
        <div className="hidden lg:flex lg:flex-col lg:justify-center lg:px-12 lg:bg-gradient-to-br lg:from-[#FF4DB8] lg:to-[#8B5CF6]">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <Image src="/icon.png" alt="Wizzmo" width={80} height={80} className="rounded-2xl mx-auto mb-6" />
              <h1 className="text-4xl font-bold text-white">become a wizzmo mentor</h1>
            </div>
            
            <div className="space-y-4 text-white/90">
              <p className="text-lg">💕 help fellow georgetown students</p>
              <p className="text-lg">🌟 build leadership skills</p> 
              <p className="text-lg">🤝 join the wizzmo community</p>
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
        <div className="h-full overflow-y-auto px-6 py-4 lg:py-12 lg:px-8 flex flex-col bg-white" style={{ WebkitOverflowScrolling: 'touch', paddingBottom: keyboardOpen ? '800px' : '50px' }}>
          <div className="sm:mx-auto sm:w-full sm:max-w-md flex-1 bg-white" style={{ minHeight: keyboardOpen ? '200vh' : '100vh' }}>
            
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
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white"
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
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white"
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white"
                  placeholder="your.email@gmail.com"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">University</label>
                  <UniversitySearch
                    value={formData.university}
                    onChange={(value) => setFormData(prev => ({ ...prev, university: value }))}
                    placeholder="Search for your university..."
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Grad Year</label>
                  <select
                    name="classYear"
                    value={formData.classYear}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white appearance-none select-arrow"
                    required
                    style={{ fontSize: '16px' }}
                  >
                    <option value="">Select Year</option>
                    {gradYears.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white resize-none min-h-[100px]"
                  placeholder="I'd make a good mentor because..."
                  required
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Handle <span className="text-gray-500">(for verification)</span></label>
                <input
                  type="text"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C147E9] focus:border-[#C147E9] text-base text-gray-900 bg-white"
                  placeholder="@your_instagram"
                  required
                  style={{ fontSize: '16px' }}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    name="confirmWoman"
                    checked={formData.confirmWoman}
                    onChange={handleInputChange}
                    className="mt-1 w-4 h-4 text-[#C147E9] border-gray-300 rounded focus:ring-[#C147E9]"
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
                    className="mt-1 w-4 h-4 text-[#C147E9] border-gray-300 rounded focus:ring-[#C147E9]"
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
                className="w-full bg-[#C147E9] text-white py-4 rounded-lg font-semibold text-lg hover:bg-[#D15EF0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>

            <p className="text-gray-500 text-center text-xs mt-6">
              We'll get back to you ASAP!
            </p>
            
            {/* Dynamic white space based on keyboard state */}
            {keyboardOpen && (
              <>
                <div className="h-96 bg-white"></div>
                <div className="h-96 bg-white"></div>
                <div className="h-96 bg-white"></div>
                <div className="h-96 bg-white"></div>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}