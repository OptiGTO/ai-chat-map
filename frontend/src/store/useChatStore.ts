import { create } from "zustand";

import {
  sampleGraphData,
  type GraphData,
  type GraphLink,
  type GraphNode,
} from "../lib/sampleGraph";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "complete" | "error";
  keywords?: string[];
};

export type FocusContext = {
  node: GraphNode;
  neighbors: GraphNode[];
};

type ChatState = {
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, update: Partial<ChatMessage>) => void;
  graph: GraphData;
  mergeGraph: (incoming: GraphData) => void;
  focus: FocusContext | null;
  setFocus: (context: FocusContext) => void;
  clearFocus: () => void;
};

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, update) =>
    set((state) => ({
      messages: state.messages.map((message) =>
        message.id === id ? { ...message, ...update } : message
      ),
    })),
  graph: sampleGraphData,
  mergeGraph: (incoming) =>
    set((state) => {
      const nodeMap = new Map(state.graph.nodes.map((node) => [node.id, node]));
      const nextNodes = [...state.graph.nodes];

      incoming.nodes.forEach((node) => {
        const existing = nodeMap.get(node.id);
        if (existing) {
          existing.label = node.label;
          existing.type = node.type;
          return;
        }
        const nextNode = { ...node };
        nodeMap.set(nextNode.id, nextNode);
        nextNodes.push(nextNode);
      });

      const getLinkKey = (link: GraphLink) => {
        const source =
          typeof link.source === "string" ? link.source : link.source.id;
        const target =
          typeof link.target === "string" ? link.target : link.target.id;
        if (!source || !target) {
          return { key: "", source: "", target: "" };
        }
        return { key: `${source}->${target}`, source, target };
      };

      const linkMap = new Set(state.graph.links.map((link) => getLinkKey(link).key));
      const nextLinks = [...state.graph.links];

      incoming.links.forEach((link) => {
        const { key, source, target } = getLinkKey(link);
        if (!key || linkMap.has(key)) {
          return;
        }
        linkMap.add(key);
        nextLinks.push({ source, target });
      });

      return { graph: { nodes: nextNodes, links: nextLinks } };
    }),
  focus: null,
  setFocus: (context) => set({ focus: context }),
  clearFocus: () => set({ focus: null }),
}));
