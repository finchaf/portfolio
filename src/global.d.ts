import type { Messages } from "./i18n/catalog";
import type { Locale } from "./i18n/locales";

// A key the code asks for and the Russian catalog lacks does not compile.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
