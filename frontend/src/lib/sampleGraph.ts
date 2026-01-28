export type GraphNodeType = "question" | "answer" | "keyword";

export type GraphNode = {
  id: string;
  label: string;
  type: GraphNodeType;
};

export type GraphLink = {
  source: string | GraphNode;
  target: string | GraphNode;
};

export type GraphData = {
  nodes: GraphNode[];
  links: GraphLink[];
};

export const sampleGraphData: GraphData = {
  nodes: [
    { id: "q-1", label: "How does context expand?", type: "question" },
    { id: "a-1", label: "Conversation branches into nodes", type: "answer" },
    { id: "q-2", label: "What powers the 3D view?", type: "question" },
    { id: "a-2", label: "R3F + Three.js + force layout", type: "answer" },
    { id: "k-1", label: "Keywords", type: "keyword" },
    { id: "k-2", label: "Embeddings", type: "keyword" },
    { id: "k-3", label: "Bloom", type: "keyword" },
    { id: "k-4", label: "Fly-to camera", type: "keyword" },
  ],
  links: [
    { source: "q-1", target: "a-1" },
    { source: "a-1", target: "k-1" },
    { source: "a-1", target: "k-2" },
    { source: "q-2", target: "a-2" },
    { source: "a-2", target: "k-3" },
    { source: "a-2", target: "k-4" },
    { source: "k-1", target: "k-3" },
  ],
};
