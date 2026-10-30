import { FlowPage } from "@/features/flow/flow-page";
import { pageMetadata } from "@/i18n/page-metadata";

export async function generateMetadata({ params }: PageProps<"/[locale]/flow">) {
  return pageMetadata(await params, "/flow");
}

export default function Page() {
  return <FlowPage />;
}
