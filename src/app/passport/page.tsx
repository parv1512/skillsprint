import Link from "next/link";
import { Icon } from "@/components/icon";
import { LearningPassport } from "@/components/learning-passport";
export default function PassportPage() {
  return <><div className="page-heading"><h1>Learning Passport</h1><Link className="button button-primary" href="/projects/new">New project<Icon name="plus" /></Link></div><LearningPassport /></>;
}
