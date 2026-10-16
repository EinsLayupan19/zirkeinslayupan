import { certificates } from "../data";
import { ArrowUpRight } from "./Icons";

export default function Certificates() {
  return (
    <section id="certifications" aria-label="Certifications">
      <h2 className="heading">Certifications</h2>
      <ul className="certs">
        {certificates.map((c) => (
          <li key={c.title}>
            <a className="row" href={c.href} target="_blank" rel="noopener noreferrer">
              <span className="t">{c.title}</span>
              <span className="m">{[c.issuer, c.year].filter(Boolean).join(" · ")}</span>
              <ArrowUpRight />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
