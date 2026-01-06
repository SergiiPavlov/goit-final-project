import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json"
      }
    },
    rules: {
      "no-console": ["error", { "allow": ["warn", "error"] }]
    }
  },
  {
    ignores: ["dist/**", "node_modules/**"]
  }
];
