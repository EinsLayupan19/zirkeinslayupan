import { links, profile } from "../data";

export default function Footer() {
  return (
    <footer>
      <ul>
        <li>
          <a href={links.github} target="_blank" rel="noopener noreferrer">GitHub</a>
        </li>
        <li>
          {links.linkedin ? (
            <a href={links.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a>
          ) : (
            <span className="pending">LinkedIn</span>
          )}
        </li>
        <li>
          {links.email ? <a href={`mailto:${links.email}`} title={links.email}>Email</a> : <span className="pending">Email</span>}
        </li>
        {links.resume ? (
          <li>
            <a href={links.resume} target="_blank" rel="noopener noreferrer">Résumé</a>
          </li>
        ) : null}
      </ul>
      <span className="yr">© {new Date().getFullYear()} {profile.name}</span>
    </footer>
  );
}
