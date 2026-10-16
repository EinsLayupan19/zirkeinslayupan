import { FormEvent, useRef, useState } from "react";
import { links, profile } from "../data";
import { sendContact, validate, type ContactField, type ContactFields } from "../contact";

const EMPTY: ContactFields = { name: "", email: "", message: "", company: "" };

// /contact: ways to reach you, plus a form that emails you (api/contact.ts). Reply in your inbox goes straight
// to the visitor. If sending isn't possible, the form says so and points to your email instead.
export default function ContactPage() {
  const [fields, setFields] = useState<ContactFields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [formError, setFormError] = useState<{ text: string; useEmail: boolean } | null>(null);
  const [sentTo, setSentTo] = useState("");
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };
  const done = useRef<HTMLDivElement>(null);

  const set = (k: keyof ContactFields) => (e: { target: { value: string } }) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (k !== "company" && errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (status === "sending") return;
    setFormError(null);
    const problem = validate(fields);
    if (problem) {
      setErrors({ [problem.field]: problem.error });
      refs[problem.field].current?.focus();
      return;
    }
    setErrors({});
    setStatus("sending");
    const r = await sendContact(fields);
    if (r.ok) {
      setSentTo(fields.email.trim());
      setFields(EMPTY);
      setStatus("sent");
      requestAnimationFrame(() => done.current?.focus());
      return;
    }
    setStatus("failed");
    if (r.field) {
      setErrors({ [r.field]: r.error });
      refs[r.field].current?.focus();
    } else {
      setFormError({ text: r.error, useEmail: r.useEmail });
    }
  }

  const mail = links.email ? <a href={`mailto:${links.email}`}>{links.email}</a> : null;
  const describe = (k: ContactField) => (errors[k] ? `contact-${k}-error` : undefined);

  return (
    <article className="contact-page">
      <header className="contact-head">
        <h1 className="page-title" tabIndex={-1}>
          Contact
        </h1>
        <p className="contact-lead">Have a question or an opportunity? Send me a message and it goes straight to my inbox.</p>
      </header>

      <div className="contact-layout">
        <ul className="contact-ways" aria-label="Other ways to reach me">
          {links.email ? (
            <li>
              <span className="k">Email</span>
              {mail}
            </li>
          ) : null}
          {links.linkedin ? (
            <li>
              <span className="k">LinkedIn</span>
              <a href={links.linkedin} target="_blank" rel="noopener noreferrer">
                {profile.name}
              </a>
            </li>
          ) : null}
          <li>
            <span className="k">GitHub</span>
            <a href={links.github} target="_blank" rel="noopener noreferrer">
              {links.githubHandle}
            </a>
          </li>
        </ul>

        <div className="contact-main">

      {status === "sent" ? (
        <div className="contact-done" role="status" tabIndex={-1} ref={done}>
          <p className="t">Message sent. Thank you!</p>
          <p className="d">I'll reply to {sentTo}.</p>
          <button type="button" className="contact-again" onClick={() => setStatus("idle")}>
            Send another message
          </button>
        </div>
      ) : (
        <form className="contact-form" noValidate onSubmit={onSubmit}>
          <div className="field">
            <label htmlFor="contact-name">Name</label>
            <input
              ref={refs.name}
              id="contact-name"
              name="name"
              autoComplete="name"
              maxLength={100}
              required
              placeholder="Your name"
              value={fields.name}
              onChange={set("name")}
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={describe("name")}
            />
            {errors.name ? <p className="field-error" id="contact-name-error">{errors.name}</p> : null}
          </div>

          <div className="field">
            <label htmlFor="contact-email">Email</label>
            <input
              ref={refs.email}
              id="contact-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={254}
              required
              placeholder="you@example.com"
              value={fields.email}
              onChange={set("email")}
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={describe("email")}
            />
            {errors.email ? <p className="field-error" id="contact-email-error">{errors.email}</p> : null}
          </div>

          <div className="field">
            <label htmlFor="contact-message">Message</label>
            <textarea
              ref={refs.message}
              id="contact-message"
              name="message"
              rows={5}
              maxLength={5000}
              required
              placeholder="Hi Eins, ..."
              value={fields.message}
              onChange={set("message")}
              aria-invalid={errors.message ? true : undefined}
              aria-describedby={describe("message")}
            />
            {errors.message ? <p className="field-error" id="contact-message-error">{errors.message}</p> : null}
          </div>

          {/* Bot trap: invisible to people, skipped by keyboards and screen readers. */}
          <div className="hp" aria-hidden="true">
            <label htmlFor="contact-company">Company</label>
            <input id="contact-company" name="company" tabIndex={-1} autoComplete="off" value={fields.company} onChange={set("company")} />
          </div>

          {formError ? (
            <p className="contact-error" role="alert">
              {formError.text}
              {formError.useEmail && mail ? <> Please email me directly at {mail}.</> : null}
            </p>
          ) : null}

          <button type="submit" className="contact-send" disabled={status === "sending"} aria-busy={status === "sending" || undefined}>
            {status === "sending" ? "Sending..." : "Send message"}
          </button>
        </form>
      )}
        </div>
      </div>
    </article>
  );
}
