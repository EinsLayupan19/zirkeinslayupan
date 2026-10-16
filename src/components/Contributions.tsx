import { useEffect, useMemo, useRef, useState } from "react";
import { links } from "../data";
import { snapshot } from "../contributionsSnapshot";
import { ArrowUpRight } from "./Icons";

type Day = { count: number; level: number };

const USER = "EinsLayupan19";
const API = `https://github-contributions-api.jogruber.de/v4/${USER}?y=last`;
const DAY = 86_400_000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

function fromSnapshot(): Map<string, Day> {
  return new Map(snapshot.days.map(([date, count, level]) => [date, { count, level }]));
}

export default function Contributions() {
  const [days, setDays] = useState<Map<string, Day>>(fromSnapshot);
  const [total, setTotal] = useState(snapshot.total);
  const scroller = useRef<HTMLDivElement>(null);

  // Refresh from the live calendar when the network allows it; otherwise keep the snapshot.
  useEffect(() => {
    const ctl = new AbortController();
    fetch(API, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { total?: { lastYear?: number }; contributions: { date: string; count: number; level: number }[] }) => {
        const m = new Map<string, Day>();
        let sum = 0;
        for (const c of data.contributions) {
          m.set(c.date, { count: c.count, level: c.level });
          sum += c.count;
        }
        setDays(m);
        setTotal(data.total?.lastYear ?? sum);
      })
      .catch(() => {});
    return () => ctl.abort();
  }, []);

  // Last 53 weeks ending today, weeks start on Sunday like GitHub.
  const { weeks, labels } = useMemo(() => {
    const now = new Date();
    const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    let start = today - 364 * DAY;
    start -= new Date(start).getUTCDay() * DAY;
    const count = Math.floor((today - start) / (7 * DAY)) + 1;

    const weeks: (string | null)[][] = [];
    const labels: { week: number; text: string }[] = [];
    let lastMonth = -1;
    let lastLabel = -10;
    for (let w = 0; w < count; w++) {
      const col: (string | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const t = start + (w * 7 + d) * DAY;
        col.push(t > today ? null : iso(t));
      }
      weeks.push(col);
      const month = new Date(start + w * 7 * DAY).getUTCMonth();
      if (month !== lastMonth && w - lastLabel >= 3) {
        labels.push({ week: w, text: MONTHS[month] });
        lastLabel = w;
      }
      lastMonth = month;
    }
    return { weeks, labels };
  }, []);

  // Open scrolled to the most recent weeks on narrow screens.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  const label = (date: string) => {
    const c = days.get(date)?.count ?? 0;
    const d = new Date(`${date}T00:00:00Z`);
    const text = `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
    return `${c === 0 ? "No contributions" : `${c} contribution${c === 1 ? "" : "s"}`} on ${text}`;
  };

  return (
    <section id="github" aria-label="GitHub activity">
      <h2 className="heading">GitHub activity</h2>
      <div className="gh">
        <div className="gh-head">
          <span className="gh-total">
            <strong>{total}</strong> contributions in the last year
          </span>
          <a className="gh-link" href={links.github} target="_blank" rel="noopener noreferrer">
            {links.githubHandle}
            <ArrowUpRight />
          </a>
        </div>

        <div className="gh-scroll" ref={scroller}>
          <div className="gh-inner" role="img" aria-label={`${total} contributions on GitHub in the last year`}>
            <div className="gh-months" aria-hidden="true">
              {labels.map((l) => (
                <span key={l.week} style={{ left: `calc(${l.week} * (var(--cell) + var(--gap)))` }}>
                  {l.text}
                </span>
              ))}
            </div>
            <div className="gh-grid" aria-hidden="true">
              {weeks.map((col, w) =>
                col.map((date, d) =>
                  date ? (
                    <i className="cell" key={date} data-l={days.get(date)?.level ?? 0} title={label(date)} />
                  ) : (
                    <i className="cell none" key={`f${w}-${d}`} />
                  )
                )
              )}
            </div>
          </div>
        </div>

        <div className="gh-legend" aria-hidden="true">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <i className="cell" data-l={l} key={l} />
          ))}
          <span>More</span>
        </div>
      </div>
    </section>
  );
}
