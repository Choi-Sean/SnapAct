import CtaSection from '@/components/CtaSection';
import Faq from '@/components/Faq';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Nav from '@/components/Nav';
import ParamPreview from '@/components/ParamPreview';
import PrivacyShowcase from '@/components/PrivacyShowcase';
import Reveal from '@/components/Reveal';
import TrustBar from '@/components/TrustBar';
import Why from '@/components/Why';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* <TrustBar /> */}
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <Features />
        </Reveal>
        <Reveal>
          <PrivacyShowcase />
        </Reveal>
        <Reveal>
          <ParamPreview />
        </Reveal>
        <Reveal>
          <Why />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
        <Reveal>
          <CtaSection />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
