import GreenSquares from "./GreenSquares";

// /play: the Green Squares mini game.
export default function PlayPage() {
  return (
    <article className="play-page">
      <header className="play-head">
        <h1 className="page-title" tabIndex={-1}>
          Green Squares
        </h1>
        <p className="play-lead">
          Jump the bugs, stay under the 503s, and collect green squares. Every square you grab fills the graph below
          the game.
        </p>
        <p className="play-keys">Space, Up arrow or W to jump (hold for a higher jump). On a phone, tap.</p>
      </header>
      <GreenSquares />
    </article>
  );
}
