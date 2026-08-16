import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import PolicyPage from '@/components/PolicyPage';

export default function ChildSafetyPage() {
  return (
    <>
      <Nav />
      <main>
        <PolicyPage docKey="childSafety" />
      </main>
      <Footer />
    </>
  );
}
