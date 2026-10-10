import Link from "next/link";
import { Icon } from "@/components/icon";
export default function PassportPage() {
  return <><div className="page-heading"><h1>Learning Passport</h1><Link className="button button-primary" href="/projects/new">New project<Icon name="plus" /></Link></div><div className="passport-sheet"><section className="passport-sheet-main"><h2>No skills recorded yet</h2><p>Your skills and supporting project work will appear here.</p><p className="quiet-note">Evidence tracking is coming soon.</p></section><aside className="passport-sheet-aside"><ul className="passport-legend"><li><span className="skill-state skill-new">New</span><p>No recorded practice</p></li><li><span className="skill-state skill-practiced">Practiced</span><p>Supported by project work</p></li><li><span className="skill-state skill-mastered">Mastered</span><p>Supported by verified understanding</p></li></ul></aside></div></>;
}
