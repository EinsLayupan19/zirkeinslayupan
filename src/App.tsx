import { useEffect, useRef } from "react";
import Profile from "./components/Profile";
import Stats from "./components/Stats";
import Achievements from "./components/Achievements";
import Work from "./components/Work";
import Contributions from "./components/Contributions";
import Certificates from "./components/Certificates";
import Skills from "./components/Skills";
import Footer from "./components/Footer";
import ContactPage from "./components/ContactPage";
import PlayPage from "./components/PlayPage";
import PlaySection from "./components/PlaySection";
import GreenSquares from "./components/GreenSquares";
import Adra from "./components/Adra";
import AboutPage from "./components/AboutPage";
import Link from "./components/Link";
import Nav from "./components/Nav";
import { routeOf, usePath, type Route } from "./router";
import { useClickEffects } from "./useClickEffects";

const TITLES: Record<Route, string> = {
  home: "Eins Layupan",
  about: "About | Eins Layupan",
  contact: "Contact | Eins Layupan",
  play: "Green Squares | Eins Layupan",
  notfound: "Page not found | Eins Layupan",
};

export default function App() {
  useClickEffects();
  const route = routeOf(usePath());
  const shown = useRef(route); // the page already on screen; React may run effects twice in development

  // After switching pages, give the page a matching title and move keyboard/screen-reader focus to its heading.
  useEffect(() => {
    document.title = TITLES[route];
    if (shown.current === route) return; // first load: leave focus where the browser put it
    shown.current = route;
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
          <PlaySection />
          <Certificates />
          <Skills />
        </>
      ) : route === "about" ? (
        <AboutPage />
      ) : route === "contact" ? (
        <ContactPage />
      ) : route === "play" ? (
        <PlayPage />
      ) : (
        <div className="notfound">
          <h1 tabIndex={-1}>Page not found</h1>
          <p>
            That page doesn't exist. Go to the <Link href="/">portfolio</Link>, the <Link href="/about">About page</Link> or the <Link href="/contact">Contact page</Link>.
          </p>
          <p className="notfound-play">While you're here, play a round of Green Squares.</p>
          <GreenSquares />
        </div>
      )}
      <Footer />
    </main>
    <Adra />
    </>
  );
}
