import { ProjectsPage } from "@/features/projects/projects-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/projects">) {
  return pageMetadata(await params, "/projects");
}

export default function Page() {
  return <ProjectsPage />;
}
