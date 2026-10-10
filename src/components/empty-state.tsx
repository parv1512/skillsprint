import Link from "next/link";
import { Icon } from "./icon";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: { href: string; label: string } }) {
  return <div className="empty-state"><span className="empty-icon"><Icon name="code" width="28" height="28" /></span><h3>{title}</h3><p>{description}</p>{action && <Link className="button button-secondary" href={action.href}>{action.label}<Icon name="arrow" /></Link>}</div>;
}
