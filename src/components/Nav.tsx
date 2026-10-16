import { useEffect, useRef, useState } from "react";
import { links, profile } from "../data";
import type { Route } from "../router";
import Link from "./Link";
import ThemeToggle from "./ThemeToggle";

type Section = "work" | "contact";

// Sticky site navigation. Its background appears once the page scrolls under it, and on the home page the link
// for the section in view is underlined. Both use IntersectionObserver, never a scroll listener.
export default function Nav({ route }: { route: Route }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [active, setActive] = useState<Section | null>(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setActive(null);
    if (typeof IntersectionObserver === "undefined") return;
    let workInView = false;
    let contactInView = false;
    const update = () => setActive(contactInView ? "contact" : workInView ? "work" : null);
    // Work counts as current while it crosses the middle of the screen; Contact (the footer) as soon as it shows.
    const workIo = new IntersectionObserver(([e]) => { workInView = e.isIntersecting; update(); }, { rootMargin: "-45% 0px -50% 0px" });
    const contactIo = new IntersectionObserver(([e]) => { contactInView = e.isIntersecting; update(); });
    // Only the long home page tracks sections. On shorter pages the footer is always on screen, so Contact would
    // be underlined next to the current page.
    const work = document.getElementById("work");
    const contact = document.getElementById("contact");
    if (route === "home") {
      if (work) workIo.observe(work);
      if (contact) contactIo.observe(contact);
    }
    return () => {
      workIo.disconnect();
      contactIo.disconnect();
    };
  }, [route]);

  const short = profile.name.split(" ")[1] ?? profile.name; // "Eins"

  return (
    <>
      <div ref={sentinel} className="nav-sentinel" aria-hidden="true" />
      <header className="nav" data-stuck={stuck}>
        <nav className="col nav-inner" aria-label="Main">
          <Link className="brand" href="/" aria-current={route === "home" ? "page" : undefined}>
            <img src={profile.photo} alt="" width={28} height={28} />
            <span className="full">{profile.name}</span>
            <span className="short" aria-hidden="true">{short}</span>
          </Link>
          <ul className="nav-links">
            <li>
              {route === "home" ? (
                <a href="#work" data-active={active === "work"}>Work</a>
              ) : (
                <Link href="/#work">Work</Link>
              )}
            </li>
            <li>
              <Link href="/about" aria-current={route === "about" ? "page" : undefined}>About</Link>
            </li>
            <li>
              <a href="#contact" data-active={active === "contact"}>Contact</a>
            </li>
            {links.resume ? (
              <li>
                <a href={links.resume} target="_blank" rel="noopener noreferrer">Résumé</a>
              </li>
            ) : null}
          </ul>
          <ThemeToggle />
        </nav>
      </header>
    </>
  );
}
