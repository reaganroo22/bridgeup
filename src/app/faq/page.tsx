"use client";

import Navigation from "@/components/sections/navigation";
import Footer from "@/components/sections/footer";
import { useState } from "react";

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is Wizzmo?",
      answer: "Wizzmo is a college advice app that connects students anonymously with verified college mentors. Whether you need help with dating, academics, roommate issues, or social situations, our community of real college students is here to help with honest, experience-based advice."
    },
    {
      question: "Is it really anonymous?",
      answer: "Yes! Your questions are completely anonymous. We've designed our system so that mentors can see your question and provide relevant advice, but they cannot identify who asked it. Your privacy and anonymity are our top priorities."
    },
    {
      question: "Who are the mentors?",
      answer: "All our mentors are verified college students. We check student IDs, university emails, and conduct background reviews to ensure they're real students from accredited colleges and universities. They're your peers who have been through similar experiences."
    },
    {
      question: "What topics can I ask about?",
      answer: "You can ask about anything related to college life! Popular topics include dating and relationships, roommate conflicts, academic stress, social situations, campus life, mental health support, career advice, and more. If it's relevant to your college experience, we're here to help."
    },
    {
      question: "How do I become a mentor?",
      answer: "To become a Wizzmo mentor, you need to be a current college student and go through our verification process. This includes submitting your student ID, university email verification, and completing our mentor training. Visit our 'Become a Wizzmo' page to start the application process."
    },
    {
      question: "Is Wizzmo free to use?",
      answer: "Yes, Wizzmo is free to download and use! We believe that peer support should be accessible to all college students. We may introduce premium features in the future, but our core service will always remain free."
    },
    {
      question: "How quickly will I get advice?",
      answer: "Most questions receive responses within a few hours, though it can vary depending on the topic and time of day. Our mentors are college students too, so response times may be slower during exam periods or late at night."
    },
    {
      question: "What if I get bad advice?",
      answer: "All advice goes through our moderation system, and you can rate responses to help us maintain quality. Remember that mentors are sharing their personal experiences, not professional advice. Always use your best judgment and consult professionals for serious matters."
    },
    {
      question: "Can I talk to the same mentor again?",
      answer: "While questions are anonymous, you can follow mentors whose advice you find helpful. This allows you to see their responses to other questions and increases the likelihood of getting advice from mentors whose perspectives resonate with you."
    },
    {
      question: "What happens if someone is inappropriate?",
      answer: "We have zero tolerance for inappropriate behavior. You can report any content or users that violate our community guidelines. Our moderation team reviews all reports within 24 hours and takes appropriate action, including warnings, suspensions, or permanent bans."
    },
    {
      question: "Do you share my personal information?",
      answer: "No, we do not sell or share your personal information with third parties. We only collect the minimum information necessary to provide our service and verify our mentors. Please read our Privacy Policy for detailed information about how we handle your data."
    },
    {
      question: "Can I delete my account?",
      answer: "Yes, you can delete your account at any time through your profile settings. When you delete your account, we remove your personal information, though anonymized questions and advice may remain visible to maintain the helpful content for other users."
    },
    {
      question: "Is there an age limit?",
      answer: "Wizzmo is designed for college-aged students (typically 18+). Users under 18 need parental consent to use the app. We verify that all mentors are current college students, which naturally maintains an appropriate age range for our community."
    },
    {
      question: "What if I need professional help?",
      answer: "While our mentors provide valuable peer support, they're not licensed professionals. For serious mental health concerns, academic issues requiring official intervention, legal matters, or emergencies, we always recommend consulting appropriate professionals or your campus resources."
    },
    {
      question: "How do you verify mentors?",
      answer: "Our verification process includes checking student IDs, university email addresses, and sometimes additional documentation. We also review social media profiles and conduct background checks when necessary. This ensures our mentors are real, current college students."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6]">
        <div className="container mx-auto px-5 text-center">
          <h1 className="font-display font-black text-white leading-none lowercase text-[3rem] md:text-[5rem] tracking-tighter mb-6">
            frequently asked questions
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto">
            Everything you need to know about using Wizzmo safely and effectively.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="container mx-auto px-5">
          <div className="max-w-4xl mx-auto">
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors"
                  >
                    <h3 className="text-lg md:text-xl font-bold text-white lowercase pr-4">
                      {faq.question}
                    </h3>
                    <div className="text-white/60 text-2xl transform transition-transform">
                      {openIndex === index ? '−' : '+'}
                    </div>
                  </button>

                  {openIndex === index && (
                    <div className="px-8 pb-6">
                      <p className="text-white/80 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Still Have Questions */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-br from-[#FF4DB8] to-[#8B5CF6] rounded-2xl p-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 lowercase">still have questions?</h2>
                <p className="text-white/90 mb-6">
                  Can't find what you're looking for? Our support team is here to help!
                </p>
                <a
                  href="mailto:support@wizzmo.app"
                  className="inline-block bg-white text-black text-lg font-bold rounded-full px-8 py-3 hover:bg-neutral-200 transition-colors transform hover:scale-105"
                >
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}