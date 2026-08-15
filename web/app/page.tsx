import CtaSection from '@/components/CtaSection';
import Features from '@/components/Features';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import HowItWorks from '@/components/HowItWorks';
import Nav from '@/components/Nav';
import ParamPreview from '@/components/ParamPreview';
import TrustBar from '@/components/TrustBar';
import Why from '@/components/Why';

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <TrustBar />
        <HowItWorks />
        <Features />
        <ParamPreview />
        <Why />
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
