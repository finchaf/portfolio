import { PortfolioPage } from "@/features/projects/portfolio-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/projects/portfolio">) {
  return pageMetadata(await params, "/projects/portfolio");
}

export default function Page() {
  return <PortfolioPage />;
}
