// Next.js's rules with Core Web Vitals, typed TypeScript rules, accessibility, the boundaries
// between the folders of src/, and no text in the markup: every string a reader sees comes from
// the catalogs in messages/ (docs/02-project-structure/repository.md).
import js from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import jsxA11y from "eslint-plugin-jsx-a11y";
import tseslint from "typescript-eslint";

// Attributes that carry text for a reader: a literal in one of them is hardcoded text, the same
// as a literal between tags, which `react/jsx-no-literals` does not see.
const TEXT_ATTRIBUTES = [
  "alt",
  "aria-description",
  "aria-label",
  "aria-placeholder",
  "aria-roledescription",
  "aria-valuetext",
  "label",
  "placeholder",
  "title",
];

const FEATURES = ["flow", "home", "pora", "projects"];

// Who may import whom. Foundations know nothing of what is built on them, and a feature knows
// nothing of another: what two features share moves down into ui/, motion/ or lib/.
const BOUNDARIES = [
  ...FEATURES.map((feature) => ({
    target: `./src/features/${feature}`,
    from: "./src/features",
    except: [`./${feature}`],
    message: "A feature does not import another: what they share moves down to ui/ or lib/.",
  })),
  ...["./src/ui", "./src/lib", "./src/i18n", "./src/themes"].map((target) => ({
    target,
    from: ["./src/features", "./src/shell", "./src/app"],
    message: "A foundation does not import what is built on it.",
  })),
  {
    target: "./src/shell",
    from: ["./src/features", "./src/app"],
    message: "The shell does not import the pages it surrounds.",
  },
  {
    target: "./src/features",
    from: ["./src/app", "./src/shell"],
    message: "A feature sits inside the shell and does not reach for it or for a route.",
  },
];

const config = tseslint.config(
  {
    ignores: [
      ".next/**",
      "out/**",
      "docs/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
    ],
  },
  js.configs.recommended,
  ...nextVitals,
  ...tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    settings: { "import/resolver": { typescript: { project: "./tsconfig.json" } } },
    rules: {
      ...jsxA11y.flatConfigs.strict.rules,
      "import/no-restricted-paths": ["error", { zones: BOUNDARIES }],
      "react/jsx-no-literals": [
        "error",
        { noStrings: true, ignoreProps: true, allowedStrings: ["·", "—", "©"] },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: `JSXAttribute[name.name=/^(${TEXT_ATTRIBUTES.join("|")})$/] > Literal`,
          message: "Text for a reader comes from the catalogs in messages/, not a literal.",
        },
      ],
      // The rule is for the Pages Router, which this site does not use.
      "@next/next/no-html-link-for-pages": "off",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);

export default config;
