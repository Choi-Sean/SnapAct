import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import PolicyPage from '@/components/PolicyPage';

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main>
        <PolicyPage docKey="privacy" />
      </main>
      <Footer />
    </>
  );
}
