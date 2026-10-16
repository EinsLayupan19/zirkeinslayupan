import { useEffect, useRef } from "react";
import Profile from "./components/Profile";
import Stats from "./components/Stats";
import Achievements from "./components/Achievements";
import Work from "./components/Work";
import Contributions from "./components/Contributions";
import Certificates from "./components/Certificates";
import Stack from "./components/Stack";
import Footer from "./components/Footer";
import Adra from "./components/Adra";
import AboutPage from "./components/AboutPage";
import Link from "./components/Link";
import Nav from "./components/Nav";
import { routeOf, usePath, type Route } from "./router";
import { useClickEffects } from "./useClickEffects";

const TITLES: Record<Route, string> = {
  home: "Eins Layupan",
  about: "About | Eins Layupan",
  notfound: "Page not found | Eins Layupan",
};

export default function App() {
  useClickEffects();
  const route = routeOf(usePath());
  const first = useRef(true);

  // After switching pages, give the page a matching title and move keyboard/screen-reader focus to its heading.
  useEffect(() => {
    document.title = TITLES[route];
    if (first.current) {
      first.current = false;
      return;
    }
    document.querySelector<HTMLElement>("main h1")?.focus({ preventScroll: true });
    // Arriving at a section link from another page (e.g. /about -> /#work): scroll to that section.
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }, [route]);

  return (
    <>
    <Nav route={route} />
    <main className="col" id="top">
      {route === "home" ? (
        <>
          <Profile />
          <Stats />
          <Achievements />
          <Work />
          <Contributions />
          <Certificates />
          <Stack />
        </>
      ) : route === "about" ? (
        <AboutPage />
      ) : (
        <div className="notfound">
          <h1 tabIndex={-1}>Page not found</h1>
          <p>
            That page doesn't exist. Go to the <Link href="/">portfolio</Link> or the <Link href="/about">About page</Link>.
          </p>
        </div>
      )}
      <Footer />
    </main>
    <Adra />
    </>
  );
}
