import { sharedConfig } from "../../eslint.config.js";
import tseslint from "typescript-eslint";

/**
 * ESLint config for apps/evtelemetryai.
 * Extends the shared monorepo config with app-specific overrides.
 */
export default tseslint.config(
  ...sharedConfig,
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/ban-ts-comment": "off",
    },
  }
);
