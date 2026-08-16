import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import PolicyPage from '@/components/PolicyPage';

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main>
        <PolicyPage docKey="terms" />
      </main>
      <Footer />
    </>
  );
}
