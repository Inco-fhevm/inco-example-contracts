import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  {
    languageOptions: {
      globals: globals.node,
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    ignores: ["abi/", "artifacts/", "cache/", "res/", "types/*"],
    rules: {
      "max-len": ["error", { code: 200 }], // Adjust the max line length to 120
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
];
