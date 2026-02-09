import GraphCanvas from "./GraphCanvas";

export default function SceneShell() {
  return (
    <div className="fixed inset-0 z-0 h-full w-full overflow-hidden bg-black">
      <div className="absolute inset-0 z-0">
        <GraphCanvas />
      </div>

      {/* Overlay Gradients */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,0)_0%,rgba(5,7,12,0.5)_100%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,transparent_20%,transparent_80%,rgba(0,0,0,0.3)_100%)]"
        aria-hidden="true"
      />
    </div>
  );
}
