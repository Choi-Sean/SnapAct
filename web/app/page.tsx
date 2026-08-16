import CtaSection from '@/components/CtaSection';
import Faq from '@/components/Faq';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Nav from '@/components/Nav';
import ParamPreview from '@/components/ParamPreview';
import Pipeline from '@/components/Pipeline';
import TrustBar from '@/components/TrustBar';
import Why from '@/components/Why';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        {/* <TrustBar /> */}
        <HowItWorks />
        <Features />
        <ParamPreview />
        <Pipeline />
        <Why />
        <Faq />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
