import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "../lib/types";

export default function MessageView({ message }: { message: Message }) {
  const isStreamingEmpty =
    message.role === "assistant" && message.content === "" && message.status === "streaming";

  return (
    <article
      className={`msg msg-${message.role}`}
      aria-label={message.role === "user" ? "Your message" : "Assistant reply"}
    >
      <div className="msg-bubble">
        {isStreamingEmpty ? (
          <span className="typing-indicator" aria-label="Assistant is thinking">
            <span />
            <span />
            <span />
          </span>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
        )}

        {message.events.length > 0 && (
          <details className="tool-trace">
            <summary>
              How this was answered ({message.events.length} step
              {message.events.length === 1 ? "" : "s"})
            </summary>
            <ul>
              {message.events.map((ev, i) => (
                <li key={i}>
                  {ev.kind === "tool_call" ? (
                    <code>
                      → {ev.name}({JSON.stringify(ev.args)})
                    </code>
                  ) : (
                    <code>
                      ← {ev.name}: {ev.preview}
                    </code>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}

        {message.status === "error" && message.error && (
          <p className="error-text">Error: {message.error}</p>
        )}
      </div>
    </article>
  );
}
