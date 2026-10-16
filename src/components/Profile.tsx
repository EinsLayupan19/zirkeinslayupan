import { useLayoutEffect, useRef, useState } from "react";
import { links, profile } from "../data";
import { ChevronDown } from "./Icons";

export default function Profile() {
  const [expanded, setExpanded] = useState(false);
  const bioRef = useRef<HTMLDivElement>(null);

  // Animate the height between the faded preview and the full bio.
  useLayoutEffect(() => {
    const el = bioRef.current;
    if (!el) return;
    el.style.maxHeight = expanded ? `${el.scrollHeight}px` : "";
  }, [expanded]);

  return (
    <header className="profile">
      <figure className="avatar">
        <img src={profile.photo} width={800} height={1000} alt={profile.photoAlt} />
      </figure>

      <div className="id">
        <h1 className="name">{profile.name}</h1>
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

      <div className="bio-wrap" id="about">
        <div ref={bioRef} className={`bio${expanded ? "" : " collapsed"}`} id="bio">
          {profile.bio.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <button className="more" type="button" aria-expanded={expanded} aria-controls="bio" onClick={() => setExpanded((v) => !v)}>
          <ChevronDown />
          <span>{expanded ? "Show less" : "More about me"}</span>
        </button>
      </div>
    </header>
  );
}
