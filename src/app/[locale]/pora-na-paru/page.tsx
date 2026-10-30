import { PoraPage } from "@/features/pora/pora-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/pora-na-paru">) {
  return pageMetadata(await params, "/pora-na-paru");
}

export default function Page() {
  return <PoraPage />;
}
