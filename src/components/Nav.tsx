import { useEffect, useRef, useState } from "react";
import { links, profile } from "../data";
import type { Route } from "../router";
import Link from "./Link";
import ThemeToggle from "./ThemeToggle";

// Sticky site navigation. Its background appears once the page scrolls under it; the current page's link is
// underlined, and on the home page so is Work while that section is in view. IntersectionObserver, never a
// scroll listener.
export default function Nav({ route }: { route: Route }) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);
  const [workActive, setWorkActive] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    setWorkActive(false);
    const work = document.getElementById("work");
    if (route !== "home" || !work || typeof IntersectionObserver === "undefined") return;
    // Work counts as current while it crosses the middle of the screen.
    const io = new IntersectionObserver(([e]) => setWorkActive(e.isIntersecting), { rootMargin: "-45% 0px -50% 0px" });
    io.observe(work);
    return () => io.disconnect();
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
                <a href="#work" data-active={workActive}>Work</a>
              ) : (
                <Link href="/#work">Work</Link>
              )}
            </li>
            <li>
              <Link href="/about" aria-current={route === "about" ? "page" : undefined}>About</Link>
            </li>
            <li>
              <Link href="/contact" aria-current={route === "contact" ? "page" : undefined}>Contact</Link>
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
