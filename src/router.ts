// A tiny router for the two pages: "/" and "/about". No library needed. Deep links work on Vercel through the
// rewrite in vercel.json, and in `npm run dev` / `npm run preview` through Vite's built-in SPA fallback.
import { useEffect, useState } from "react";

export type Route = "home" | "about" | "notfound";

export function routeOf(pathname: string): Route {
  const p = pathname.replace(/\/+$/, "") || "/";
  if (p === "/") return "home";
  if (p === "/about") return "about";
  return "notfound";
}

const EVENT = "app:navigate";

export function navigate(to: string) {
  if (to === location.pathname + location.hash) return;
  history.pushState(null, "", to);
  window.dispatchEvent(new Event(EVENT));
  // A new page starts at the top. "instant" skips the page-wide smooth scrolling meant for in-page anchors.
  window.scrollTo({ top: 0, behavior: "instant" });
}

export function usePath(): string {
  const [path, setPath] = useState(() => (typeof location === "undefined" ? "/" : location.pathname));
  useEffect(() => {
    const update = () => setPath(location.pathname);
    window.addEventListener("popstate", update);
    window.addEventListener(EVENT, update);
    return () => {
      window.removeEventListener("popstate", update);
      window.removeEventListener(EVENT, update);
    };
  }, []);
  return path;
}
