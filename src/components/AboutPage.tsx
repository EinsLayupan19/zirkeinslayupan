import { about, profile, type About } from "../data";

// /about: who you are, not what you've built (the home page covers the work). Everything comes from data.ts;
// "My story" and "Hobbies" are left out until they have content.
export default function AboutPage({ content = about }: { content?: About }) {
  const { story, hobbiesIntro, hobbies } = content;
  const ordered = [...hobbies.filter((h) => h.main), ...hobbies.filter((h) => !h.main)];
  return (
    <article className="about">
      <header className="about-hero">
        <figure className="about-photo">
          <img src={profile.photo} width={800} height={1000} alt={profile.photoAlt} />
        </figure>
        <div className="about-intro">
          <h1 className="about-title" tabIndex={-1}>
            About me
          </h1>
          <p className="about-who">
            <strong>{profile.name}</strong>
            <span>{profile.roles.join(", ")}</span>
          </p>
          <div className="about-bio">
            {profile.bio.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {profile.availability ? <p className="about-avail">{profile.availability}</p> : null}
        </div>
      </header>

      {story.length ? (
        <section aria-labelledby="about-story">
          <h2 className="heading" id="about-story">My story</h2>
          <div className="about-story">
            {story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
      ) : null}

      {hobbies.length ? (
        <section aria-labelledby="about-hobbies">
          <h2 className="heading" id="about-hobbies">Hobbies</h2>
          {hobbiesIntro ? <p className="about-hobbies-intro">{hobbiesIntro}</p> : null}
          <ul className="about-hobbies">
            {ordered.map((h) => (
              <li key={h.name} className={h.main ? "main" : undefined}>
                {h.main ? <span className="k">Favorite</span> : null}
                <span className="t">{h.name}</span>
                {h.detail ? <span className="d">{h.detail}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </article>
  );
}
