"use client";

import { useState } from "react";
import Image from "next/image";

export default function BecomeAWizzmoPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    university: '',
    year: '',
    whyJoin: '',
    topics: [] as string[],
  });

  const topicOptions = [
    'Dating & Relationships',
    'Academic Support', 
    'Roommate Issues',
    'Social Life',
    'Mental Health',
    'Career Advice',
    'Campus Life',
    'Greek Life'
  ];

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

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

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const canProceedFromStep1 = formData.firstName && formData.lastName && formData.email;
  const canProceedFromStep2 = formData.university && formData.year;
  const canSubmit = formData.whyJoin && formData.topics.length > 0;

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
          ...formData,
          major: 'To be provided',
          experience: formData.whyJoin,
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

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-white/20 rounded-full flex items-center justify-center">
            <Image src="/icon.png" alt="Wizzmo" width={40} height={40} className="rounded-lg" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Application Sent! 🎉</h1>
          <p className="text-white/90 mb-6">We'll review it and email you within 2-3 days.</p>
          <div className="bg-white/20 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3 text-white/80">
              <span>📧</span><span className="text-sm">Application under review</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <span>✅</span><span className="text-sm">Get approval email</span>
            </div>
            <div className="flex items-center gap-3 text-white/80">
              <span>🚀</span><span className="text-sm">Start mentoring!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
      {/* Header */}
      <div className="px-4 pt-8 pb-6">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Image src="/icon.png" alt="Wizzmo" width={32} height={32} className="rounded-lg" />
          <h1 className="text-2xl font-bold text-white">Become a Mentor</h1>
        </div>
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  currentStep >= step ? 'bg-white text-[#FF4DB8]' : 'bg-white/20 text-white'
                }`}>
                  {step}
                </div>
                {step < 3 && <div className={`w-8 h-0.5 mx-1 ${currentStep > step ? 'bg-white' : 'bg-white/20'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="px-4 pb-8">
        <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white rounded-2xl p-6 shadow-2xl">
          
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Let's start with the basics</h2>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-transparent text-lg"
                  placeholder="Your first name"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-transparent text-lg"
                  placeholder="Your last name"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">College Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-transparent text-lg"
                  placeholder="you@university.edu"
                />
              </div>

              <button
                type="button"
                onClick={nextStep}
                disabled={!canProceedFromStep1}
                className="w-full bg-[#FF4DB8] text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: School Info */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Your school details</h2>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">University</label>
                <input
                  type="text"
                  name="university"
                  value={formData.university}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-transparent text-lg"
                  placeholder="University of Example"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Year</label>
                <select
                  name="year"
                  value={formData.year}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-transparent text-lg"
                >
                  <option value="">Select your year</option>
                  <option value="freshman">Freshman</option>
                  <option value="sophomore">Sophomore</option>
                  <option value="junior">Junior</option>
                  <option value="senior">Senior</option>
                  <option value="graduate">Graduate Student</option>
                </select>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-4 rounded-lg font-semibold text-lg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceedFromStep2}
                  className="flex-1 bg-[#FF4DB8] text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Topics & Motivation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Almost done!</h2>
              
              <div>
                <label className="block text-gray-700 font-medium mb-3">Topics you'd mentor in (select at least 1)</label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {topicOptions.map((topic) => (
                    <label key={topic} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.topics.includes(topic)}
                        onChange={() => handleTopicChange(topic)}
                        className="w-4 h-4 text-[#FF4DB8] border-gray-300 rounded focus:ring-[#FF4DB8]"
                      />
                      <span className="text-sm text-gray-700">{topic}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Why do you want to mentor? (2-3 sentences)</label>
                <textarea
                  name="whyJoin"
                  value={formData.whyJoin}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-transparent text-lg resize-none"
                  placeholder="I want to help because..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex-1 bg-gray-300 text-gray-700 py-4 rounded-lg font-semibold text-lg"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex-1 bg-[#FF4DB8] text-white py-4 rounded-lg font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          )}

        </form>

        <p className="text-white/80 text-center text-sm mt-4 max-w-md mx-auto">
          We'll review your application and email you within 2-3 business days
        </p>
      </div>
    </div>
  );
}