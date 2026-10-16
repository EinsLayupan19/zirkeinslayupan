import GreenSquares from "./GreenSquares";

// Home page section with the Green Squares game, right after the GitHub activity graph.
export default function PlaySection() {
  return (
    <section id="play" aria-labelledby="play-title">
      <h2 className="heading" id="play-title">Green Squares</h2>
      <p className="play-intro">
        Take a break: jump the bugs, stay under the 503s, and collect green squares. Click the game or press Tab to
        it, then Space to jump. On a phone, tap.
      </p>
      <GreenSquares />
    </section>
  );
}
