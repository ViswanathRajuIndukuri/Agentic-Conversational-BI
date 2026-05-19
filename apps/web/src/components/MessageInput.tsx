import { useRef, useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  onSend: (text: string) => void;
  onCancel: () => void;
  pending: boolean;
}

function IconSend() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19V5M12 5L6 11M12 5L18 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconStop() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

export default function MessageInput({ onSend, onCancel, pending }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resize = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim() || pending) return;
    onSend(text);
    setText("");
    requestAnimationFrame(resize);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={submit} aria-label="Message composer">
        <label htmlFor="chat-input" className="visually-hidden">
          Ask about your metrics
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            resize();
          }}
          onKeyDown={onKeyDown}
          placeholder="Ask a question about your data…"
          rows={1}
          disabled={pending}
        />
        {pending ? (
          <button
            type="button"
            className="composer-send composer-stop"
            onClick={onCancel}
            aria-label="Stop generating"
          >
            <IconStop />
          </button>
        ) : (
          <button
            type="submit"
            className="composer-send"
            disabled={!text.trim()}
            aria-label="Send message"
          >
            <IconSend />
          </button>
        )}
      </form>
    </div>
  );
}
