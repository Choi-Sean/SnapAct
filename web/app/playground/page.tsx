import Footer from '@/components/Footer';
import HistorySimHeader from '@/components/HistorySimHeader';
import HistorySimulation from '@/components/HistorySimulation';
import Nav from '@/components/Nav';
import PlaygroundHeader from '@/components/PlaygroundHeader';
import PlaygroundDemo from '@/components/PlaygroundDemo';
import Reveal from '@/components/Reveal';

export default function PlaygroundPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-content px-6 py-16 md:py-20">
        <PlaygroundHeader />
        <div className="mt-12">
          <PlaygroundDemo />
        </div>

        <Reveal className="mt-24" delay={0.05}>
          <HistorySimHeader />
        </Reveal>

        <Reveal className="mt-10" delay={0.12}>
          <HistorySimulation />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
