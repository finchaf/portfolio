import { PoraPage } from "@/features/pora/pora-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/poranaparu">) {
  return pageMetadata(await params, "/poranaparu");
}

export default function Page() {
  return <PoraPage />;
}
