import { useState } from "react";
import { categories, projects, type CategoryId, type Project } from "../data";
import { ArrowRight } from "./Icons";

const labelOf = (id: CategoryId) => categories.find((c) => c.id === id)?.label ?? id;

function ProjectCard({ p }: { p: Project }) {
  const main = p.demo ?? p.repo;
  const both = Boolean(p.demo && p.repo);

  return (
    <article className="project" data-cat={p.categories[0]}>
      <div className="txt">
        <span className="k">{p.role ?? p.categories.map(labelOf).join(" · ")}</span>
        <h3 className="t">
          {main ? (
            <a href={main} target="_blank" rel="noopener noreferrer">
              {p.title}
            </a>
          ) : (
            p.title
          )}
        </h3>
        <span className="d">{p.description}</span>
        {p.summary ? <p className="s">{p.summary}</p> : null}
        {p.tech?.length ? (
          <ul className="tech" aria-label="Tech used">
            {p.tech.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        ) : null}
        {both ? (
          <span className="sub">
            <a href={p.repo} target="_blank" rel="noopener noreferrer">
              View code
            </a>
          </span>
        ) : null}
      </div>

      <div className="art" aria-hidden={p.image ? undefined : true}>
        {p.image ? (
          <img src={p.image} alt={`Preview of ${p.title}`} loading="lazy" />
        ) : (
          <div className="ph">
            <span>Preview</span>
          </div>
        )}
      </div>

      <span className={`go${main ? "" : " off"}`} title={main ? undefined : "Link coming soon"} aria-hidden="true">
        <ArrowRight />
      </span>
    </article>
  );
}

export default function Work() {
  const [active, setActive] = useState<CategoryId | null>(null);
  const shown = active ? projects.filter((p) => p.categories.includes(active)) : projects;

  return (
    <section id="work" aria-label="Work">
      <h2 className="heading">Selected work</h2>

      <div className="filters" role="group" aria-label="Filter projects by role">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            className="filter"
            aria-pressed={active === c.id}
            onClick={() => setActive(active === c.id ? null : c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="projects" aria-live="polite">
        {shown.length === 0 ? (
          <div className="card empty">
            <div>
              <span className="k">{labelOf(active!)}</span>
              <span className="t">Projects coming soon</span>
            </div>
          </div>
        ) : (
          shown.map((p) => <ProjectCard p={p} key={p.title} />)
        )}
      </div>
    </section>
  );
}
