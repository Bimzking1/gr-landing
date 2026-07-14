import DotGrid from './DotGrid';
import ShinyText from './ShinyText';

export default function Hero() {
  return (
    <header className="relative overflow-hidden border-b border-grey-600/40">
      <DotGrid />
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-display text-lg tracking-tight">
          <span className="inline-block h-2 w-2 rounded-full bg-lime animate-pulseDot" />
          GARUNA
        </div>
        <div className="hidden sm:flex items-center gap-6 font-mono text-xs text-grey-400 uppercase tracking-widest">
          <a href="#" className="hover:text-paper transition-colors">Instagram</a>
          <a href="#" className="hover:text-paper transition-colors">TikTok</a>
        </div>
      </nav>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-10 pb-24 text-center">
        <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest border border-lime/40 text-lime rounded-full px-4 py-1.5 animate-floatUp">
          <span className="h-1.5 w-1.5 rounded-full bg-lime" />
          26 days before launch
        </span>

        <h1 className="mt-8 font-display text-5xl sm:text-7xl leading-[0.95] tracking-tight animate-floatUp [animation-delay:100ms]">
          RUN TODAY.
          <br />
          OWN YOUR <span className="text-lime">RUNNER</span> TYPE.
        </h1>

        <p className="mt-6 max-w-xl mx-auto text-grey-400 text-base sm:text-lg animate-floatUp [animation-delay:200ms]">
          GARUNA is a running app that knows exactly what kind of runner you are.{' '}
          <ShinyText as="span" className="font-medium">Find out now</ShinyText> — then challenge your friends to beat your score.
        </p>

        <div className="mt-9 animate-floatUp [animation-delay:300ms]">
          <a
            href="#profiling"
            className="inline-block rounded-full bg-lime text-ink font-semibold px-7 py-3.5 hover:bg-lime-soft transition-colors"
          >
            Discover your runner type ↓
          </a>
        </div>
      </div>
    </header>
  );
}
