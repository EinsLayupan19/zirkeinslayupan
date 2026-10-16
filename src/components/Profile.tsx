import { links, profile } from "../data";
import { ArrowRight } from "./Icons";
import Link from "./Link";

export default function Profile() {
  return (
    <header className="profile">
      <figure className="avatar">
        <img src={profile.photo} width={800} height={1000} alt={profile.photoAlt} />
      </figure>

      <div className="id">
        <h1 className="name" tabIndex={-1}>{profile.name}</h1>
        <p className="rotator" aria-label={profile.roles.join(", ")}>
          {profile.roles.map((role) => (
            <span className="r" aria-hidden="true" key={role}>
              {role}
            </span>
          ))}
        </p>
        {profile.availability || links.resume ? (
          <p className="avail">
            {profile.availability ? <span>{profile.availability}</span> : null}
            {links.resume ? (
              <a href={links.resume} target="_blank" rel="noopener noreferrer">
                Résumé
              </a>
            ) : null}
          </p>
        ) : null}
      </div>

      {/* A faded preview of the bio; the full story is on /about. */}
      <div className="bio-wrap">
        <div className="bio collapsed">
          {profile.bio.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <Link className="more" href="/about">
          <span>More about me</span>
          <ArrowRight />
        </Link>
      </div>
    </header>
  );
}
