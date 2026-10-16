// Everything you will edit lives here. Components only render this data.

export const profile = {
  name: "Zirk Eins B. Layupan",
  roles: ["Data Analyst", "Web Developer", "Aspiring AI Engineer"],
  photo: "/photo.jpg",
  photoAlt: "Portrait of Zirk Eins B. Layupan, smiling, holding a whiteboard and a computer mouse",
  bio: [
    "I'm a third-year BSIT student at New Era University focused on web development, data analytics, and AI engineering. I enjoy turning ideas into working software, and I keep learning new technologies along the way.",
    "My work includes full-stack applications, AI automation, and data-driven projects. I focus on practical problems and on building systems that are simple and reliable.",
    "I'd rather build something useful than talk about what I could build.",
  ],
  /** One line under your name, e.g. "Open to internships, 2026". Leave empty to hide it. */
  availability: "",
};

export const links = {
  github: "https://github.com/EinsLayupan19",
  githubHandle: "@EinsLayupan19",
  linkedin: "https://www.linkedin.com/in/zirk-eins-layupan-44960b443/",
  email: "einslayupan17@gmail.com",
  /** Put your CV at public/resume.pdf and set this to "/resume.pdf". Leave empty to hide the Résumé links. */
  resume: "",
};

export type CategoryId = "data" | "web" | "ai";

// The three filter buttons in the Work section.
export const categories: { id: CategoryId; label: string }[] = [
  { id: "data", label: "Data Analyst" },
  { id: "web", label: "Web Developer" },
  { id: "ai", label: "AI Engineer" },
];

export type Project = {
  title: string;
  description: string;
  /** One or two sentences: what it does and what you did. Shown under the description. */
  summary?: string;
  /** Your part in it. Replaces the role label on the card, e.g. "QA". */
  role?: string;
  /** Tech used, shown as small tags. */
  tech?: string[];
  categories: CategoryId[];
  /** Screenshot or demo image. Put the file in public/projects/ and use "/projects/name.png". */
  image?: string;
  /** Live site. The card's arrow and title link here. */
  demo?: string;
  /** GitHub repo. Used for the arrow if there is no live site; otherwise shown as a small "View code" link. */
  repo?: string;
};

// Tag each project with the role(s) it belongs to. Adjust the tags to match what you actually built.
// Fill in image / demo / repo as you have them. Anything left out shows a dimmed placeholder.
// Example:
//   { title: "TaskFlow", description: "...", categories: ["web"],
//     image: "/projects/taskflow.png", demo: "https://taskflow.vercel.app", repo: "https://github.com/EinsLayupan19/taskflow" }
export const projects: Project[] = [
  {
    title: "InsightFlow",
    description: "AI Data Analyst Platform",
    summary:
      "Upload a retail CSV and get a data-quality report, sales trends, product rankings and plain-English findings, each backed by the figures behind it. All analytics run as SQL in DuckDB.",
    tech: ["React", "TypeScript", "Vite", "Python", "FastAPI", "DuckDB", "SQLite", "Ollama"],
    categories: ["data", "ai"],
    repo: "https://github.com/EinsLayupan19/insight-flow",
  },
  {
    title: "EagleDesk",
    description: "AI School Information Assistant",
    summary:
      "A school helpdesk where students ask in plain language about procedures, class schedules, the academic calendar and announcements, and get pointed to the right office.",
    tech: ["React", "TypeScript", "Tailwind", "Node.js", "Express", "Supabase", "Gemini"],
    categories: ["web", "ai"],
    repo: "https://github.com/EinsLayupan19/ai-powered-helpdesk",
  },
  {
    title: "TaskFlow",
    description: "Productivity / Workflow Application",
    summary: "A task and workflow app with user accounts (JWT auth) and a REST API on Express and MongoDB.",
    tech: ["JavaScript", "Node.js", "Express", "MongoDB", "JWT"],
    categories: ["web"],
    // The repo (github.com/EinsLayupan19/taskfloww) is private or renamed, so the link was a 404.
    // Make it public, then add it back: repo: "https://github.com/EinsLayupan19/taskfloww",
  },
  {
    title: "HR System",
    description: "Human Resources System (team project)",
    summary: "A team-built HR system. I was the team's QA, testing features and reporting bugs.",
    role: "QA",
    tech: ["React", "Vite", "Supabase", "Tailwind"],
    categories: ["web"],
    demo: "https://hr-system-2-0.vercel.app",
    repo: "https://github.com/JaronAltares/HR-System-2.0",
  },
];

export type Achievement = {
  /** Small line above the title, e.g. "Capstone" or a year. */
  label: string;
  title: string;
  /** Optional second line under the title. */
  detail?: string;
  href?: string;
};

// Only add real achievements. An empty list shows the "Coming soon" card.
export const achievements: Achievement[] = [
  {
    label: "Capstone",
    title: "Best Capstone",
    detail: "EagleDesk",
    href: "https://github.com/EinsLayupan19/ai-powered-helpdesk",
  },
];

export type Certificate = {
  title: string;
  issuer: string;
  year?: string;
  /** Link to the certificate or its verification page. */
  href: string;
};

// Details taken from the certificates themselves; links from the GitHub profile README (EinsLayupan19).
export const certificates: Certificate[] = [
  {
    title: "Oracle Data Platform 2025 Certified Foundations Associate",
    issuer: "Oracle",
    year: "2025",
    href: "https://catalog-education.oracle.com/ords/certview/sharebadge?id=00369F7A0D8A56B9C6F108BD3C6C9A8C4C9477CF2476B7BC26D388697B5CA930",
  },
  {
    title: "SQL and Relational Databases 101",
    issuer: "Cognitive Class",
    year: "2025",
    href: "https://courses.cognitiveclass.ai/certificates/cb658a90f2f64e44ba949cfa5160d1c9",
  },
  {
    title: "NoSQL and DBaaS 101",
    issuer: "Cognitive Class",
    year: "2026",
    href: "https://courses.cognitiveclass.ai/certificates/248aeeeed9e440cd902730a721867949",
  },
  {
    title: "Responsive Web Design",
    issuer: "freeCodeCamp",
    year: "2026",
    href: "https://www.freecodecamp.org/certification/einslayupan/responsive-web-design-v9",
  },
  {
    title: "Fundamentals of AI-Driven Development",
    issuer: "AI Dev PH",
    year: "2026",
    href: "https://course.marwieang.com/certificate/MWA-TF9A-NGEJ",
  },
];

// Your tools, grouped by kind. The home page shows them as one list (`stack`).
export const stackGroups: { label: string; items: string[] }[] = [
  { label: "Languages", items: ["Python", "SQL", "TypeScript", "JavaScript"] },
  { label: "Frontend", items: ["React", "Vite", "Tailwind"] },
  { label: "Backend", items: ["Node.js", "Express", "FastAPI"] },
  { label: "Data", items: ["DuckDB", "SQLite", "MongoDB", "Supabase"] },
  { label: "AI and automation", items: ["Gemini API", "OpenAI API", "Ollama", "n8n"] },
  { label: "Shipping", items: ["Vercel", "GitHub"] },
];

export const stack: string[] = stackGroups.flatMap((g) => g.items);

// The About page (/about). Sections with an empty list stay hidden, so add only what is true.
export type Hobby = {
  name: string;
  /** Optional one line, e.g. what you like about it or how long you've done it. */
  detail?: string;
  /** Your main one: shown wider, first. */
  main?: boolean;
};

export type About = {
  education: { program: string; school: string; year: string };
  /** A few short paragraphs in your own words: how you got into tech, what you enjoy, what you want to do next. */
  story: string[];
  /** A line or two above the hobbies (the "Outside of code" section). */
  hobbiesIntro?: string;
  hobbies: Hobby[];
};

// The About page (/about) is about you, not your work: bio, your story, hobbies.
// "My story" and "Outside of code" stay hidden until you add something, so only add what is true.
export const about: About = {
  education: {
    program: "BS Information Technology",
    school: "New Era University",
    year: "Third year",
  },
  story: [
    "I first became interested in technology through my uncle, who works in the field. Seeing his work gave me a clearer idea of the career I wanted for myself: work I enjoy, that challenges me to grow, and that gives me the chance to build a good future.",
    "When I started studying IT, I found that I genuinely enjoy creating systems and figuring out how technology can solve real problems.",
    "Now I'm exploring where software, data, and AI meet through the projects I build. Each one is a chance to apply what I've learned, try new technologies, and become a better developer.",
    "I'm still learning, but I'm building toward becoming someone who can create useful technology, not just understand it.",
  ],
  hobbiesIntro: "I'm a devoted Christian and a sporty person. I play almost every sport, and I also love watching movies, series, and K-dramas, listening to music, and playing online games.",
  hobbies: [
    { name: "Basketball", detail: "I played varsity in senior high school at AMA Fairview.", main: true },
    { name: "Badminton", detail: "I play a lot." },
    { name: "Baseball" },
    { name: "Volleyball" },
    { name: "Soccer" },
    { name: "Movies" },
    { name: "K-dramas and series" },
    { name: "Music" },
    { name: "Online games" },
  ],
};
