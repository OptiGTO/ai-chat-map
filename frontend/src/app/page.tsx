import SceneShell from "../components/scene/SceneShell";
import ChatPanel from "../components/ui/ChatPanel";

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 sm:gap-8">
        <header className="flex flex-wrap items-start justify-between gap-4 sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.45em] text-neutral-500">
              3D Chat Map
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight text-neutral-900 sm:text-4xl">
              A Beautiful Universe of Knowledge
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-neutral-600">
              The 2D panel now calls the backend and streams answers into the 3D
              graph.
            </p>
          </div>
          <div className="rounded-full border border-white/60 bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-neutral-500 shadow-sm">
            Day 9
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <SceneShell />
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
