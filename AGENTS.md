#+ Project Context: 3D Chat Map (MVP)

## 1. Project Definition
This project visualizes conversation context and knowledge expansion in a beautiful 3D space, creating a next-generation spatial AI chat interface. The goal is not just information delivery, but to provide an aesthetic and intuitive exploration experience.

**Core Goal:** Deliver an MVP during the break with working core features and a “wow, it’s beautiful!” reaction.
**Slogan:** “A Beautiful Universe of Knowledge.”

## 2. Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **3D Engine:** React Three Fiber (R3F) / Three.js / **@react-three/drei** (use helpers actively)
- **State Management:** Zustand (smooth 3D–2D synchronization)
- **Styling:** Tailwind CSS / **Framer Motion** (smooth 2D UI motion)
- **AI Integration:** OpenAI API
- **Layout & Effects:** `react-force-graph-3d` (physics-based layout), **post-processing** (e.g., bloom)

## 3. MVP Core Features & UX
The MVP includes not only functional completion but also visual polish and intuitive user experience.

### A. Visualization (The “Beautiful” Part)
- **Nodes:** Not plain gray spheres. Use softly glowing spheres with bloom. Color-code question vs. answer nodes for clarity.
- **Edges:** Use soft, luminous links that feel like flowing data—not harsh lines.
- **Layout:** A physics-based layout that spreads nodes naturally and avoids overlaps.
- **Labels:** Keyword labels float in 3D and always face the camera (billboard) for readability.

### B. Interaction (The “Intuitive” Part)
- **Hybrid UI:** 3D canvas and 2D chat panel should blend seamlessly.
- **Smooth Navigation:**
	- Mouse drag/wheel for orbit control.
	- **[Core UX]** Clicking a node triggers a smooth fly-to camera animation and zoom-in, while the related conversation appears in the 2D panel. This must feel fluid and uninterrupted.

### C. Chat & AI (Input & Intelligence)
- The LLM returns both an answer and key keywords for each user input.

## 4. Development Principles
**All AI agents must follow these principles when generating code:**

1. **Aesthetics Matter:** Prioritize visual quality from the start. Use proper materials and lighting instead of default meshes.
2. **Intuitive UX First:** Interactions must be natural and provide immediate feedback.
3. **Iterative Polish:**
	 - **Step 1 (Skeleton):** Build solid node/edge logic first.
	 - **Step 2 (Polish):** Add glow, materials, and animation for visual refinement.
4. **Structured Code:** Split 3D scene logic into modular components.

---
**Final Goal:** “Functionally complete, visually beautiful, and intuitively delightful.”
