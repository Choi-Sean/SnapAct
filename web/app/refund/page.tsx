import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import PolicyPage from '@/components/PolicyPage';

export default function RefundPage() {
  return (
    <>
      <Nav />
      <main>
        <PolicyPage docKey="refund" />
      </main>
      <Footer />
    </>
  );
}
