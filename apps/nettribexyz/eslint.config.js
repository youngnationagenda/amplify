import { sharedConfig } from "../../eslint.config.js";
import tseslint from "typescript-eslint";

/**
 * ESLint config for apps/nettribexyz.
 * Extends the shared monorepo config with app-specific overrides.
 */
export default tseslint.config(
  ...sharedConfig,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Suppress issues in generated UI components (shadcn/ui)
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    files: ["tailwind.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  }
);
