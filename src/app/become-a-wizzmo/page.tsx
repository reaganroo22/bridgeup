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

  const universities = [
    'Georgetown University',
    'Harvard University',
    'Stanford University',
    'Massachusetts Institute of Technology',
    'Yale University',
    'Princeton University',
    'Columbia University',
    'University of Pennsylvania',
    'Dartmouth College',
    'Brown University',
    'Cornell University',
    'University of Chicago',
    'Northwestern University',
    'Duke University',
    'Vanderbilt University',
    'Rice University',
    'Washington University in St. Louis',
    'Emory University',
    'University of Notre Dame',
    'Carnegie Mellon University',
    'University of California, Berkeley',
    'University of California, Los Angeles',
    'University of Southern California',
    'University of California, San Diego',
    'University of California, Irvine',
    'University of California, Davis',
    'University of California, Santa Barbara',
    'University of California, Santa Cruz',
    'University of California, Riverside',
    'University of California, Merced',
    'California Institute of Technology',
    'University of Michigan',
    'University of Virginia',
    'University of North Carolina at Chapel Hill',
    'Georgia Institute of Technology',
    'University of Florida',
    'University of Texas at Austin',
    'Texas A&M University',
    'University of Wisconsin-Madison',
    'University of Illinois at Urbana-Champaign',
    'Ohio State University',
    'Pennsylvania State University',
    'University of Minnesota',
    'University of Washington',
    'University of Colorado Boulder',
    'University of Arizona',
    'Arizona State University',
    'University of Oregon',
    'Oregon State University',
    'University of Utah',
    'University of Nevada, Las Vegas',
    'University of New Mexico',
    'New York University',
    'Boston University',
    'Boston College',
    'Northeastern University',
    'Tufts University',
    'Brandeis University',
    'University of Rochester',
    'Syracuse University',
    'Fordham University',
    'George Washington University',
    'American University',
    'Catholic University of America',
    'Howard University',
    'Johns Hopkins University',
    'University of Maryland, College Park',
    'Virginia Tech',
    'James Madison University',
    'University of Richmond',
    'College of William & Mary',
    'Virginia Commonwealth University',
    'Wake Forest University',
    'University of South Carolina',
    'Clemson University',
    'University of Georgia',
    'Georgia Southern University',
    'Florida State University',
    'University of Miami',
    'Florida International University',
    'University of Central Florida',
    'Florida Institute of Technology',
    'University of Alabama',
    'Auburn University',
    'University of Mississippi',
    'Mississippi State University',
    'University of Tennessee',
    'Vanderbilt University',
    'University of Kentucky',
    'University of Louisville',
    'University of Arkansas',
    'Louisiana State University',
    'Tulane University',
    'University of Oklahoma',
    'Oklahoma State University',
    'University of Kansas',
    'Kansas State University',
    'University of Missouri',
    'Missouri State University',
    'University of Nebraska',
    'University of Iowa',
    'Iowa State University',
    'University of South Dakota',
    'South Dakota State University',
    'University of North Dakota',
    'North Dakota State University',
    'University of Montana',
    'Montana State University',
    'University of Wyoming',
    'Colorado State University',
    'University of Denver',
    'Colorado College',
    'University of Idaho',
    'Boise State University',
    'Washington State University',
    'Seattle University',
    'Gonzaga University',
    'Portland State University',
    'Reed College',
    'Lewis & Clark College',
    'Willamette University',
    'Brigham Young University',
    'University of Nevada, Reno',
    'Nevada State University',
    'University of Hawaii',
    'University of Alaska Anchorage',
    'University of Alaska Fairbanks',
    'San Diego State University',
    'San Jose State University',
    'California State University, Long Beach',
    'California State University, Northridge',
    'California State University, Fullerton',
    'California State University, Los Angeles',
    'California State University, Sacramento',
    'California State University, Fresno',
    'California Polytechnic State University',
    'Santa Clara University',
    'University of San Francisco',
    'University of San Diego',
    'Pepperdine University',
    'Loyola Marymount University',
    'Occidental College',
    'Pomona College',
    'Claremont McKenna College',
    'Harvey Mudd College',
    'Scripps College',
    'Pitzer College',
    'Chapman University',
    'University of the Pacific',
    'Mills College',
    'Dominican University of California',
    'Saint Marys College of California',
    'Loyola University Chicago',
    'DePaul University',
    'University of Illinois at Chicago',
    'Illinois Institute of Technology',
    'Southern Illinois University',
    'Northern Illinois University',
    'Bradley University',
    'Knox College',
    'Lake Forest College',
    'Wheaton College',
    'Butler University',
    'Indiana University',
    'Purdue University',
    'University of Notre Dame',
    'Ball State University',
    'Indiana State University',
    'Valparaiso University',
    'DePauw University',
    'Earlham College',
    'Hanover College',
    'Wabash College',
    'Case Western Reserve University',
    'University of Cincinnati',
    'Miami University',
    'Bowling Green State University',
    'Kent State University',
    'University of Akron',
    'Wright State University',
    'Youngstown State University',
    'Ohio University',
    'Denison University',
    'Kenyon College',
    'Oberlin College',
    'College of Wooster',
    'Antioch College',
    'University of Dayton',
    'Xavier University',
    'John Carroll University',
    'Baldwin Wallace University',
    'Capital University',
    'Otterbein University',
    'Heidelberg University',
    'Muskingum University',
    'Marietta College',
    'Mount Union University',
    'Wilmington College',
    'Bluffton University',
    'Defiance College',
    'Findlay University',
    'Tiffin University',
    'Urbana University',
    'Cedarville University',
    'Central State University',
    'Wilberforce University',
    'University of Pittsburgh',
    'Temple University',
    'Drexel University',
    'Villanova University',
    'Lehigh University',
    'Lafayette College',
    'Bucknell University',
    'Franklin & Marshall College',
    'Dickinson College',
    'Gettysburg College',
    'Muhlenberg College',
    'Ursinus College',
    'Swarthmore College',
    'Haverford College',
    'Bryn Mawr College',
    'University of Scranton',
    'Saint Josephs University',
    'La Salle University',
    'Widener University',
    'West Chester University',
    'Shippensburg University',
    'Millersville University',
    'Kutztown University',
    'East Stroudsburg University',
    'Bloomsburg University',
    'Mansfield University',
    'Lock Haven University',
    'Clarion University',
    'Indiana University of Pennsylvania',
    'California University of Pennsylvania',
    'Cheyney University',
    'Lincoln University',
    'Rutgers University',
    'Princeton University',
    'Stevens Institute of Technology',
    'New Jersey Institute of Technology',
    'Seton Hall University',
    'Fairleigh Dickinson University',
    'Montclair State University',
    'Rowan University',
    'The College of New Jersey',
    'Rider University',
    'Drew University',
    'Centenary College',
    'Saint Peters University',
    'Georgian Court University',
    'Monmouth University',
    'Stockton University',
    'Kean University',
    'William Paterson University',
    'Ramapo College',
    'New Jersey City University',
    'Caldwell University',
    'Felician University',
    'Bloomfield College',
    'Other'
  ];

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
          major: 'To be determined during onboarding',
          experience: formData.whyMentor,
          topics: ['General College Advice'],
          instagram: '',
          referral: ''
        }),
      });

      if (response.ok) {
        setSubmitted(true);
      } else {
        const errorData = await response.json();
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
      <div className="min-h-screen bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] flex items-center justify-center px-4">
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
    <div className="min-h-screen bg-white lg:bg-gray-50">
      <div className="lg:grid lg:grid-cols-2 min-h-screen">
        
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
        <div className="min-h-screen overflow-y-auto px-6 py-4 lg:py-12 lg:px-8 flex flex-col">
          <div className="sm:mx-auto sm:w-full sm:max-w-md flex-1 pb-8">
            
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
                  <select
                    name="university"
                    value={formData.university}
                    onChange={handleInputChange}
                    className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white appearance-none select-arrow"
                    required
                  >
                    <option value="">Select University</option>
                    {universities.map(uni => (
                      <option key={uni} value={uni}>{uni}</option>
                    ))}
                  </select>
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
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF4DB8] focus:border-[#FF4DB8] text-base text-gray-900 bg-white resize-none min-h-[100px]"
                  placeholder="I'd make a good mentor because..."
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