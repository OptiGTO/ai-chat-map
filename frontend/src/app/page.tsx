import SceneShell from "../components/scene/SceneShell";
import ChatPanel from "../components/ui/ChatPanel";

export default function Home() {
  return (
    <main className="relative h-screen w-full overflow-hidden">
      {/* 3D Background */}
      <SceneShell />

      {/* Floating UI Layer */}
      <div className="pointer-events-none relative z-10 flex h-full w-full flex-col justify-end p-4 sm:p-6 lg:items-end lg:justify-center lg:p-10">
        {/* Header Overlay */}
        <header className="absolute left-6 top-6 max-w-md pointer-events-auto sm:left-10 sm:top-10">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-md sm:text-4xl md:text-5xl">
            Concept
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Map
            </span>
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-300 drop-shadow sm:text-base">
            Visualize your conversation in a living 3D universe.
          </p>
        </header>

        {/* Chat Panel - Floating */}
        <div className="pointer-events-auto w-full max-w-md lg:w-[420px]">
          <ChatPanel />
        </div>
      </div>
    </main>
  );
}
