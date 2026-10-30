import type { Messages } from "./i18n/catalog";
import type { Locale } from "./i18n/locales";

// A key the code asks for and the Russian catalog lacks does not compile.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}

// A custom property in a `style` object: a value a stylesheet reads, not a style of its own.
declare module "react" {
  interface CSSProperties {
    [variable: `--${string}`]: string | number;
  }
}
