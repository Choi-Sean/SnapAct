import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import PricingCards from '@/components/PricingCards';

export default function PricingPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-content px-6 py-16 md:py-20">
        <PricingCards />
      </main>
      <Footer />
    </>
  );
}
