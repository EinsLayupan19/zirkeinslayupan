import { softSkills, stackGroups } from "../data";

// Home page Skills: technical skills grouped by kind, then how you work.
export default function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title">
      <h2 className="heading" id="skills-title">Skills</h2>
      <dl className="skills-groups">
        {stackGroups.map((g) => (
          <div key={g.label}>
            <dt>{g.label}</dt>
            <dd>
              <ul className="chips">
                {g.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
      <ul className="soft-skills" aria-label="How I work">
        {softSkills.map((s) => (
          <li key={s.name}>
            <span className="t">{s.name}</span>
            {s.detail ? <span className="d">{s.detail}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
