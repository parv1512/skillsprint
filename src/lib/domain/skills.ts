// Stable identifiers are the shared vocabulary for roadmaps and the future Passport.
// Official documentation links are curated references, not proof of learning.
export const skills = [
  { id: "programming.basics", name: "Programming fundamentals", description: "Variables, conditions, loops, and functions.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting", resourceTitle: "MDN: JavaScript fundamentals" },
  { id: "project.scoping", name: "Project scoping", description: "Turn an idea into a focused outcome and clear acceptance criteria." },
  { id: "git.basics", name: "Git fundamentals", description: "Track changes and make useful commits.", url: "https://git-scm.com/docs/gittutorial", resourceTitle: "Git tutorial" },
  { id: "html.semantics", name: "Semantic HTML", description: "Build a page with meaningful elements and clear structure.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content", resourceTitle: "MDN: Structuring content" },
  { id: "css.layout", name: "CSS layout", description: "Use spacing, Flexbox, and Grid to arrange a page.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout", resourceTitle: "MDN: CSS layout" },
  { id: "ui.responsive", name: "Responsive interfaces", description: "Make layouts usable across screen sizes.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/CSS_layout/Responsive_Design", resourceTitle: "MDN: Responsive design" },
  { id: "ui.accessibility", name: "Web accessibility", description: "Use labels, keyboard controls, and meaningful page structure.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Accessibility", resourceTitle: "MDN: Accessibility" },
  { id: "javascript.basics", name: "JavaScript fundamentals", description: "Work with functions, arrays, objects, and control flow.", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide", resourceTitle: "MDN: JavaScript guide" },
  { id: "typescript.types", name: "TypeScript types", description: "Describe and check the shape of application data.", url: "https://www.typescriptlang.org/docs/handbook/intro.html", resourceTitle: "TypeScript handbook" },
  { id: "react.components", name: "React components", description: "Break an interface into reusable components and props.", url: "https://react.dev/learn/your-first-component", resourceTitle: "React: Your first component" },
  { id: "react.state", name: "React state", description: "Keep an interface in sync with changing data.", url: "https://react.dev/learn/managing-state", resourceTitle: "React: Managing state" },
  { id: "react.effects", name: "React effects", description: "Synchronize components with external systems.", url: "https://react.dev/learn/synchronizing-with-effects", resourceTitle: "React: Synchronizing with effects" },
  { id: "forms.validation", name: "Forms and validation", description: "Collect inputs and give useful feedback for invalid data.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms", resourceTitle: "MDN: Web forms" },
  { id: "http.requests", name: "API requests", description: "Send requests, read responses, and handle failures.", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", resourceTitle: "MDN: Using Fetch" },
  { id: "api.design", name: "API design", description: "Define endpoints, request data, and predictable responses.", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview", resourceTitle: "MDN: HTTP overview" },
  { id: "nextjs.routing", name: "Next.js routing", description: "Connect pages and server endpoints in a Next.js application.", url: "https://nextjs.org/docs/app/getting-started/layouts-and-pages", resourceTitle: "Next.js: Layouts and pages" },
  { id: "nodejs.basics", name: "Node.js fundamentals", description: "Run JavaScript on the server.", url: "https://nodejs.org/en/learn/getting-started/introduction-to-nodejs", resourceTitle: "Introduction to Node.js" },
  { id: "python.basics", name: "Python fundamentals", description: "Build programs using Python data structures and functions.", url: "https://docs.python.org/3/tutorial/", resourceTitle: "Python tutorial" },
  { id: "java.basics", name: "Java fundamentals", description: "Use Java classes, methods, and core language constructs.", url: "https://dev.java/learn/", resourceTitle: "Learn Java" },
  { id: "data.modeling", name: "Data modeling", description: "Identify entities, relationships, and useful data constraints.", url: "https://www.postgresql.org/docs/current/tutorial.html", resourceTitle: "PostgreSQL tutorial" },
  { id: "sql.basics", name: "SQL fundamentals", description: "Query and update relational data.", url: "https://www.postgresql.org/docs/current/tutorial-sql.html", resourceTitle: "PostgreSQL: SQL language" },
  { id: "storage.browser", name: "Browser storage", description: "Save local data and understand its privacy and lifetime.", url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API", resourceTitle: "MDN: Web Storage" },
  { id: "auth.basics", name: "Authentication fundamentals", description: "Distinguish identity, sessions, and access permissions.", url: "https://auth0.com/docs/get-started/identity-fundamentals", resourceTitle: "Auth0: Identity fundamentals" },
  { id: "testing.basics", name: "Testing fundamentals", description: "Check expected behavior and important failure cases." },
  { id: "debugging.basics", name: "Debugging", description: "Reproduce a problem and use evidence to find its cause.", url: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_went_wrong", resourceTitle: "MDN: Troubleshooting JavaScript" },
  { id: "deployment.basics", name: "Deployment fundamentals", description: "Configure, publish, and smoke-test an application." },
  { id: "algorithms.basics", name: "Algorithms and data structures", description: "Choose simple data structures and reason through a solution." },
] as const;

export const skillIds = new Set<string>(skills.map((skill) => skill.id));
export function findSkill(id: string) { return skills.find((skill) => skill.id === id); }
