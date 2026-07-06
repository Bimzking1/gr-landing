import Hero from '@/components/Hero';
import ProfilingGame from '@/components/ProfilingGame';
import ProjectionGame from '@/components/ProjectionGame';
import FitReader from '@/components/FitReader';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-ink">
      <Hero />
      <ProfilingGame />
      <ProjectionGame />
      <FitReader />
      <Footer />
    </main>
  );
}
