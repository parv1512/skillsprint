"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="panel empty-state" role="alert"><h1>We couldn’t open this page.</h1><p>Please try again. If the problem continues, return to your overview.</p><button className="button button-primary" onClick={reset}>Try again</button><a className="text-link" href="/">Return to overview</a></section>;
}
