import Hero from '@/components/Hero';
import ProfilingGame from '@/components/ProfilingGame';
// import ProjectionGame from '@/components/ProjectionGame'; // Commented out — removed per user request
// import FitReader from '@/components/FitReader'; // Commented out — merged into ProfilingGame
import Footer from '@/components/Footer';
import LoopingColumns from '@/components/LoopingColumns';

export default function Home() {
  return (
    <main className="min-h-screen bg-ink page-bg">
      <LoopingColumns />
      <div className="relative z-10">
        <Hero />
        <ProfilingGame />
        {/* <ProjectionGame /> — removed per user request */}
        {/* <FitReader /> — merged into ProfilingGame */}
        <Footer />
      </div>
    </main>
  );
}
