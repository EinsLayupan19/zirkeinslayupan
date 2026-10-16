import { FormEvent, useEffect, useRef, useState } from "react";
import { ask, suggestions, type Answer, type Reply } from "../adra";

type Msg = { id: number; from: "adra" | "me"; text: string; links?: Reply["links"] };

const GREETING: Msg = {
  id: 0,
  from: "adra",
  text: "Hi, I'm Adra. Ask me about Eins's projects, tech stack, certifications or how to reach him.",
};

export default function Adra() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([GREETING]);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState("");
  const [source, setSource] = useState<Answer["source"] | null>(null);
  const idRef = useRef(1);
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const fab = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [msgs, typing, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        fab.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(raw: string) {
    const q = raw.trim();
    if (!q || typing) return;
    setMsgs((m) => [...m, { id: idRef.current++, from: "me", text: q }]);
    setText("");
    setTyping(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const history = msgs.map((m) => ({ from: m.from, text: m.text }));
    const [r] = await Promise.all([ask(q, history), new Promise((res) => setTimeout(res, reduce ? 150 : 650))]);
    setTyping(false);
    setSource(r.source);
    setMsgs((m) => [...m, { id: idRef.current++, from: "adra", text: r.text, links: r.links }]);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(text);
  }

  return (
    <>
      {open ? (
        <section className="adra-panel" role="dialog" aria-label="Chat with Adra">
          <header className="adra-head">
            <span className="adra-avatar" aria-hidden="true">A</span>
            <div className="adra-title">
              <strong>Adra</strong>
              <span>Assistant</span>
            </div>
            <button className="adra-x" type="button" aria-label="Close chat" onClick={() => { setOpen(false); fab.current?.focus(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div className="adra-log" ref={log} aria-live="polite">
            {msgs.map((m) => (
              <div className={`adra-msg ${m.from}`} key={m.id}>
                <p>{m.text}</p>
                {m.links?.length ? (
                  <div className="adra-links">
                    {m.links.map((l) => (
                      <a href={l.href} target="_blank" rel="noopener noreferrer" key={l.href}>
                        {l.label}
                      </a>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            {typing ? (
              <div className="adra-msg adra" aria-label="Adra is typing">
                <p className="adra-dots"><i /><i /><i /></p>
              </div>
            ) : null}
          </div>

          <div className="adra-chips">
            {suggestions.map((s) => (
              <button type="button" key={s} onClick={() => void send(s)} disabled={typing}>
                {s}
              </button>
            ))}
          </div>

          <form className="adra-form" onSubmit={onSubmit}>
            <input
              ref={input}
              id="adra-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask Adra something"
              aria-label="Message Adra"
              autoComplete="off"
              maxLength={200}
            />
            <button type="submit" aria-label="Send" disabled={!text.trim() || typing}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </form>
          <p className="adra-note">
            {source === "ai"
              ? "Answers by Gemini, based on this site. It can get things wrong."
              : "Answers come from this site's content."}
          </p>
        </section>
      ) : null}

      <button
        ref={fab}
        className={`adra-fab${open ? " is-open" : ""}`}
        type="button"
        aria-label={open ? "Close chat with Adra" : "Chat with Adra"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg className="i-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4h0A2.5 2.5 0 0 1 4 13.5z" />
          <path d="M9 8.5h6M9 11.5h4" />
        </svg>
        <svg className="i-close" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </>
  );
}
