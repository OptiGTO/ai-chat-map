import GraphCanvas from "./GraphCanvas";

const gradientStyle = {
  backgroundImage:
    "radial-gradient(800px circle at 15% 20%, rgba(255, 255, 255, 0.28), rgba(15, 23, 42, 0)), radial-gradient(700px circle at 80% 10%, rgba(45, 212, 191, 0.25), rgba(15, 23, 42, 0)), linear-gradient(135deg, #0b1120 0%, #0b3b5a 55%, #0d7e77 100%)",
};

export default function SceneShell() {
  return (
    <section className="relative flex min-h-[420px] w-full flex-col justify-between overflow-hidden rounded-3xl border border-white/20 text-white shadow-[0_30px_80px_rgba(15,23,42,0.18)] sm:min-h-[480px]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={gradientStyle}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,0.25),transparent_55%),radial-gradient(circle_at_20%_85%,rgba(56,189,248,0.18),transparent_60%)] opacity-90 mix-blend-screen"
        aria-hidden="true"
      />
      <div className="absolute inset-0 z-0">
        <GraphCanvas />
      </div>
      <div className="relative z-10 flex h-full flex-col justify-between p-6 pointer-events-none sm:p-8">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.3em] text-white/70 sm:text-xs">
          <span>3D Space</span>
          <span>Day 9 Flow</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-semibold leading-tight sm:text-2xl">
            The map now syncs with real AI replies.
          </h2>
          <p className="mt-3 text-xs text-white/70 sm:text-sm">
            Each answer and keyword grows the graph in real time.
          </p>
        </div>
      </div>
    </section>
  );
}
