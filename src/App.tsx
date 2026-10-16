import Profile from "./components/Profile";
import Stats from "./components/Stats";
import Achievements from "./components/Achievements";
import Work from "./components/Work";
import Contributions from "./components/Contributions";
import Certificates from "./components/Certificates";
import Stack from "./components/Stack";
import Footer from "./components/Footer";
import ThemeToggle from "./components/ThemeToggle";
import Adra from "./components/Adra";
import { useClickEffects } from "./useClickEffects";

export default function App() {
  useClickEffects();
  return (
    <>
    <main className="col" id="top">
      <div className="topbar">
        <ThemeToggle />
      </div>
      <Profile />
      <Stats />
      <Achievements />
      <Work />
      <Contributions />
      <Certificates />
      <Stack />
      <Footer />
    </main>
    <Adra />
    </>
  );
}
