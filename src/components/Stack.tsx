import { stack } from "../data";

export default function Stack() {
  return (
    <section id="stack" aria-label="Stack">
      <h2 className="heading">Stack</h2>
      <ul className="chips">
        {stack.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
