import Link from "next/link";
import { Icon } from "@/components/icon";

export default function NewProjectPage() {
  return <><div className="page-heading"><div><p className="eyebrow">FROM IDEA TO FIRST STEP</p><h1>What would you love to build?</h1><p className="subtitle">A meaningful project starts with a problem you care about.</p></div></div><section className="panel coming-soon"><span className="empty-icon"><Icon name="spark" width="28" height="28" /></span><h2>Your project journey is taking shape</h2><p>Project creation will be available in the next build phase. You’ll share your idea, experience, available time, and learning goals to get a roadmap tailored to you.</p><div className="intake-preview"><span>01 &nbsp; Describe your idea</span><span>02 &nbsp; Tell us where you’re starting</span><span>03 &nbsp; Get your learning roadmap</span></div><Link href="/" className="button button-secondary">Back to overview<Icon name="arrow" /></Link></section></>;
}
