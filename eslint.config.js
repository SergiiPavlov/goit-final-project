import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        // Dedicated TSConfig for ESLint so we can lint non-src TS files
        // (e.g. prisma/seed) without breaking type-aware linting.
        project: "./tsconfig.eslint.json"
      }
    },
    rules: {
      "no-console": ["error", { "allow": ["warn", "error"] }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "caughtErrorsIgnorePattern": "^_"
        }
      ]
    }
  },
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"]
  }
];
