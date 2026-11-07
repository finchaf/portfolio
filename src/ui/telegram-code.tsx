import { TELEGRAM_URL } from "@/lib/site";
import { LinkCode } from "@/ui/link-code";

/** The way to the chat as a code a phone reads, with the logo's slash in its middle. */
export function TelegramCode({
  label,
  className,
}: {
  label: string;
  /** Its look where it stands. */
  className: string;
}) {
  return <LinkCode className={className} label={label} url={TELEGRAM_URL} />;
}
