"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";

import { useChatStore } from "../../store/useChatStore";

const typePillStyles: Record<string, string> = {
  question:
    "border-sky-200 bg-sky-500/10 text-sky-700 shadow-[0_10px_20px_rgba(56,189,248,0.25)]",
  answer:
    "border-emerald-200 bg-emerald-500/10 text-emerald-700 shadow-[0_10px_20px_rgba(16,185,129,0.2)]",
  keyword:
    "border-amber-200 bg-amber-400/20 text-amber-700 shadow-[0_10px_20px_rgba(251,191,36,0.25)]",
};

type ChatApiResponse = {
  status: "success";
  question: string;
  answer: string;
  keywords: string[];
  graph: {
    nodes: Array<{ id: string; label: string; type: "question" | "answer" | "keyword" }>;
    links: Array<{ source: string; target: string }>;
  };
};

export default function ChatPanel() {
  const focus = useChatStore((state) => state.focus);
  const messages = useChatStore((state) => state.messages);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateMessage = useChatStore((state) => state.updateMessage);
  const mergeGraph = useChatStore((state) => state.mergeGraph);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

  const createId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);

  const suggestedPrompts = useMemo(
    () => [
      "Why does context become a spatial map?",
      "Show me how nodes are connected.",
      "Explain how the camera fly-to should feel.",
    ],
    []
  );

  const handleSubmit = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || isSending) {
      return;
    }

    setErrorMessage(null);

    const userId = createId();
    addMessage({ id: userId, role: "user", content: trimmed });
    setInput("");

    const replyId = createId();
    addMessage({
      id: replyId,
      role: "assistant",
      content: "Synthesizing a response...",
      status: "pending",
    });

    setIsSending(true);
    try {
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!response.ok) {
        let detail = "";
        try {
          const payload = (await response.json()) as { detail?: string };
          detail = payload?.detail ?? "";
        } catch {
          detail = "";
        }
        throw new Error(detail || `Request failed (${response.status})`);
      }

      const data = (await response.json()) as ChatApiResponse;
      updateMessage(replyId, {
        content: data.answer,
        status: "complete",
        keywords: data.keywords,
      });
      if (data.graph?.nodes?.length) {
        mergeGraph(data.graph);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to reach the AI service.";
      updateMessage(replyId, {
        content: `Sorry, something went wrong. ${message}`,
        status: "error",
      });
      setErrorMessage(message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <aside className="flex min-h-[420px] flex-col gap-5 rounded-3xl border border-white/60 bg-white/70 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.12)] backdrop-blur sm:min-h-[480px] sm:gap-6 sm:p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-400">
            Conversation
          </p>
          <h2 className="text-xl font-semibold text-neutral-900">
            Hybrid Chat Panel
          </h2>
        </div>
        <span className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-500">
          Day 9
        </span>
      </div>

      <div className="flex-1 space-y-4 text-sm text-neutral-600">
        <AnimatePresence mode="wait">
          {focus ? (
            <motion.div
              key={`focus-${focus.node.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="rounded-2xl bg-white/90 p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                    Focused Node
                  </p>
                  <p className="mt-2 text-base font-semibold text-neutral-900">
                    {focus.node.label}
                  </p>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] ${
                    typePillStyles[focus.node.type] ?? typePillStyles.keyword
                  }`}
                >
                  {focus.node.type}
                </span>
              </div>
              <p className="mt-3 text-xs text-neutral-500">
                Linked concepts update with each click in the 3D scene.
              </p>
              {focus.neighbors.length > 0 ? (
                <div className="mt-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                    Linked Concepts
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {focus.neighbors.map((neighbor) => (
                      <span
                        key={neighbor.id}
                        className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-semibold text-neutral-600"
                      >
                        {neighbor.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              key="focus-empty"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl bg-white/80 p-4 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                System
              </p>
              <p className="mt-2">
                Click a node to sync its context, neighbors, and focus state
                here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="rounded-2xl border border-white/60 bg-white/75 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
              Conversation
            </p>
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
              {messages.length} messages
            </span>
          </div>
          {errorMessage ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[11px] font-semibold text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          <div className="mt-4 flex max-h-[220px] flex-col gap-3 overflow-y-auto pr-2 sm:max-h-[260px]">
            <AnimatePresence initial={false}>
              {messages.length > 0 ? (
                messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                    layout
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        message.status === "error"
                          ? "border border-rose-200 bg-rose-50 text-rose-700"
                          : message.role === "user"
                            ? "bg-neutral-900 text-white"
                            : "bg-white text-neutral-700"
                      } ${message.status === "pending" ? "animate-pulse" : ""}`}
                    >
                      <p>{message.content}</p>
                      {message.keywords && message.keywords.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.keywords.map((keyword) => (
                            <span
                              key={keyword}
                              className="rounded-full border border-neutral-200 bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {message.status === "pending" ? (
                        <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
                          typing<span className="animate-pulse">...</span>
                        </div>
                      ) : null}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 p-4 text-neutral-500"
                >
                  Start with a question and watch the map respond.
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white/60 p-4 text-xs text-neutral-500">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-neutral-400">
            Suggested prompts
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-[11px] font-semibold text-neutral-600 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => handleSubmit(prompt)}
                disabled={isSending}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form
        className="flex flex-col items-stretch gap-3 rounded-2xl border border-neutral-200 bg-white/80 p-2 sm:flex-row sm:items-center"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(input);
        }}
      >
        <input
          className="flex-1 bg-transparent px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
          placeholder="Ask something to grow the map"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
        />
        <button
          className={`rounded-xl px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] ${
            isSending
              ? "cursor-not-allowed bg-neutral-300 text-neutral-500"
              : "bg-neutral-900 text-white"
          }`}
          type="submit"
          disabled={isSending}
        >
          {isSending ? "Sending" : "Send"}
        </button>
      </form>
    </aside>
  );
}
