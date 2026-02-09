"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Send, Sparkles, Map, MessageSquare } from "lucide-react";

import { useChatStore } from "../../store/useChatStore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const typePillStyles: Record<string, string> = {
  question:
    "border-sky-500/20 bg-sky-500/10 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.1)]",
  answer:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)]",
  keyword:
    "border-amber-500/20 bg-amber-500/10 text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.1)]",
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
    <aside className="flex min-h-[420px] flex-col gap-4 rounded-3xl border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-xl sm:min-h-[520px] sm:gap-5 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Conversation
            </p>
            <h2 className="text-lg font-bold text-white">AI Chat Map</h2>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 backdrop-blur-md">
          <div className="relative h-2 w-2">
            <div className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></div>
            <div className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Active
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        {/* Focus Panel */}
        <AnimatePresence mode="wait">
          {focus ? (
            <motion.div
              key={`focus-${focus.node.id}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5" />
              <div className="relative flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Map className="h-3 w-3 text-indigo-400" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                      Focused Node
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {focus.node.label}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
                    typePillStyles[focus.node.type] ?? typePillStyles.keyword
                  )}
                >
                  {focus.node.type}
                </span>
              </div>

              {focus.neighbors.length > 0 && (
                <div className="mt-4 border-t border-white/5 pt-3">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-1 w-1 rounded-full bg-slate-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Linked Concepts
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {focus.neighbors.map((neighbor) => (
                      <span
                        key={neighbor.id}
                        className="rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-white"
                      >
                        {neighbor.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="focus-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-center"
            >
              <Map className="mx-auto mb-2 h-5 w-5 text-slate-500" />
              <p className="text-xs text-slate-400">
                Click a node in 3D space to view details
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message List */}
        <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-between border-b border-white/5 p-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Chat History
              </span>
            </div>
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              {messages.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {errorMessage && (
              <div className="mb-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-medium text-rose-400">
                {errorMessage}
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn(
                        "flex w-full",
                        message.role === "user" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground rounded-tr-sm"
                            : "bg-white/10 text-slate-100 rounded-tl-sm border border-white/5"
                        )}
                      >
                        <p className="leading-relaxed">{message.content}</p>

                        {message.keywords && message.keywords.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-white/10">
                            {message.keywords.map((keyword) => (
                              <span
                                key={keyword}
                                className="rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-black/20 text-slate-400"
                              >
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}

                        {message.status === "pending" && (
                          <div className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-widest text-white/50">
                            <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: "0ms" }} />
                            <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: "150ms" }} />
                            <span className="h-1 w-1 animate-bounce rounded-full bg-current" style={{ animationDelay: "300ms" }} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-slate-500">
                  <Sparkles className="h-8 w-8 opacity-20" />
                  <p className="text-sm">Start the conversation...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Suggested Prompts */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-slate-300 transition hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-white disabled:opacity-50"
              onClick={() => handleSubmit(prompt)}
              disabled={isSending}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form
        className="relative flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit(input);
        }}
      >
        <Input
          className="h-12 border-white/10 bg-white/5 pr-12 text-white placeholder:text-slate-500 focus-visible:border-indigo-500/50 focus-visible:ring-indigo-500/20"
          placeholder="Ask AI about..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={isSending}
        />
        <Button
          size="icon"
          type="submit"
          disabled={isSending || !input.trim()}
          className={cn(
            "absolute right-1.5 top-1.5 h-9 w-9 transition-all",
            isSending ? "bg-slate-700" : "bg-indigo-600 hover:bg-indigo-500"
          )}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </aside>
  );
}
