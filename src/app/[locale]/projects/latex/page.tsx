import { LatexPage } from "@/features/projects/latex-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/latex">) {
  return pageMetadata(await params, "/projects/latex");
}

export default function Page() {
  return <LatexPage />;
}
