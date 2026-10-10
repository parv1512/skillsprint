import Link from "next/link";

export default function NotFound() {
  return <section className="panel empty-state"><p className="eyebrow">404</p><h1>This page isn’t on your roadmap.</h1><p>Let’s get you back to your workspace.</p><Link href="/" className="button button-primary">Back to overview</Link></section>;
}
