import Footer from '@/components/Footer';
import Nav from '@/components/Nav';
import PlaygroundHeader from '@/components/PlaygroundHeader';
import PlaygroundDemo from '@/components/PlaygroundDemo';

export default function PlaygroundPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-content px-6 py-16 md:py-20">
        <PlaygroundHeader />
        <div className="mt-12">
          <PlaygroundDemo />
        </div>
      </main>
      <Footer />
    </>
  );
}
