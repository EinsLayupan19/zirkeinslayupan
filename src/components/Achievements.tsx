import { achievements } from "../data";
import { ArrowRight } from "./Icons";

export default function Achievements() {
  return (
    <section className="cards" id="achievements" aria-label="Achievements">
      {achievements.length === 0 ? (
        <div className="card empty">
          <div>
            <span className="k">Achievements</span>
            <span className="t">Coming soon</span>
          </div>
        </div>
      ) : (
        <div className="ach-list">
          {achievements.map((a) => {
            const body = (
              <>
                <div>
                  <span className="k">{a.label}</span>
                  <span className="t">{a.title}</span>
                  {a.detail ? <span className="d">{a.detail}</span> : null}
                </div>
                {a.href ? <ArrowRight /> : null}
              </>
            );
            return a.href ? (
              <a className="card win" href={a.href} rel="noopener" key={a.title}>
                {body}
              </a>
            ) : (
              <div className="card win" key={a.title}>
                {body}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
