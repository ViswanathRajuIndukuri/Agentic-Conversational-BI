import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { postSse } from "../lib/sse";
import type { Message, ToolEvent } from "../lib/types";
import MessageView from "./Message";
import MessageInput from "./MessageInput";

const SUGGESTIONS = [
  "How did revenue trend by quarter last year?",
  "Who were our top customers last quarter?",
  "Compare year-over-year order growth",
];

export default function ChatPanel() {
  const { accessToken } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [pending, setPending] = useState(false);
  const threadIdRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || pending) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      events: [],
      status: "done",
    };
    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
      events: [],
      status: "streaming",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setPending(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const update = (mut: (m: Message) => Message) =>
      setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? mut(m) : m)));

    try {
      const stream = postSse(
        "/api/chat",
        { message: text, thread_id: threadIdRef.current },
        controller.signal,
        accessToken,
      );

      for await (const ev of stream) {
        const payload = JSON.parse(ev.data);
        switch (ev.event) {
          case "ready":
            threadIdRef.current = payload.thread_id;
            break;
          case "text_delta":
            update((m) => ({ ...m, content: m.content + payload.delta }));
            break;
          case "tool_call": {
            const tool: ToolEvent = {
              kind: "tool_call",
              name: payload.name,
              args: payload.args ?? {},
            };
            update((m) => ({ ...m, events: [...m.events, tool] }));
            break;
          }
          case "tool_result": {
            const tool: ToolEvent = {
              kind: "tool_result",
              name: payload.name,
              preview: payload.preview ?? "",
            };
            update((m) => ({ ...m, events: [...m.events, tool] }));
            break;
          }
          case "error":
            update((m) => ({ ...m, status: "error", error: payload.message }));
            break;
          case "done":
            update((m) => ({ ...m, status: m.status === "error" ? "error" : "done" }));
            break;
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        update((m) => ({ ...m, status: "done" }));
      } else {
        const message = err instanceof Error ? err.message : String(err);
        update((m) => ({ ...m, status: "error", error: message }));
      }
    } finally {
      abortRef.current = null;
      setPending(false);
    }
  };

  const cancel = () => abortRef.current?.abort();

  return (
    <section className="chat" aria-label="Analytics chat">
      <div className="chat-messages" ref={scrollRef} role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <div className="chat-empty-icon" aria-hidden>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path
                  d="M21 11.5C21 16.75 16.75 21 11.5 21C9.9 21 8.4 20.55 7.1 19.75L3 21L4.25 16.9C3.45 15.6 3 14.1 3 12.5C3 7.25 7.25 3 12.5 3C17.75 3 21 7.25 21 11.5Z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2>What do you want to know?</h2>
            <p>
              Guided answers from your approved definitions. Pick a starter or ask in your own
              words.
            </p>
            <div className="suggestion-chips">
              {SUGGESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  className="suggestion-chip"
                  onClick={() => send(q)}
                  disabled={pending}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m) => <MessageView key={m.id} message={m} />)
        )}
      </div>
      <MessageInput onSend={send} onCancel={cancel} pending={pending} />
    </section>
  );
}
