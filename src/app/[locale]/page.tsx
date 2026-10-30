import { HomePage } from "@/features/home/home-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]">) {
  return pageMetadata(await params, "");
}

export default function Page() {
  return <HomePage />;
}
