import Navigation from "@/components/sections/navigation";
import HeroSection from "@/components/sections/hero";
import ScrollIndicator from "@/components/sections/scroll-indicator";
import HowItWorksSection from "@/components/sections/how-it-works";
import TopicsGrid from "@/components/sections/topics-grid";
import LiveFeed from "@/components/sections/live-feed";
import SafetyTrustSection from "@/components/sections/safety-trust";
import FAQSection from "@/components/sections/faq";
import CtaFinal from "@/components/sections/cta-final";
import Footer from "@/components/sections/footer";

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      <HeroSection />
      <ScrollIndicator />
      <HowItWorksSection />
      <TopicsGrid />
      <LiveFeed />
      <SafetyTrustSection />
      <FAQSection />
      <CtaFinal />
      <Footer />
    </main>
  );
}