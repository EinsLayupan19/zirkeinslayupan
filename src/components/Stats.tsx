import { links, projects } from "../data";
import { ArrowUpRight } from "./Icons";

export default function Stats() {
  return (
    <div className="stats" aria-label="At a glance">
      <a className="stat" href="#about">
        <span className="n">3rd yr</span>
        <span className="l">BSIT student</span>
        <ArrowUpRight />
      </a>
      <a className="stat" href="#work">
        <span className="n">{projects.length}</span>
        <span className="l">Featured projects</span>
        <ArrowUpRight />
      </a>
      <a className="stat" href={links.github} rel="noopener">
        <span className="n">GitHub</span>
        <span className="l">{links.githubHandle}</span>
        <ArrowUpRight />
      </a>
    </div>
  );
}
