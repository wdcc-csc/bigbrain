import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["dist", "src/__test__", "**/*config.js"] },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "detect" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react-hooks/exhaustive-deps": "off",
      "no-unused-vars": "off",
      "react/jsx-no-target-blank": ["error", { enforceDynamicLinks: "always" }],
      "react-refresh/only-export-components": "off",
      "react/no-unstable-nested-components": ["error", { allowAsProps: true }],
      "prefer-arrow-callback": [
        "error",
        {
          allowNamedFunctions: true,
        },
      ],
      "react/jsx-one-expression-per-line": "off",
      "react/no-unescaped-entities": "off",
      "no-dupe-keys": "off",
      indent: ["error", 2],
      "react/prop-types": "off",
    },
  },
  {
    files: ["cypress/**/*.{js,jsx,ts,tsx}", "**/*.cy.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        cy: "readonly",
        Cypress: "readonly",
        describe: "readonly",
        it: "readonly",
        beforeEach: "readonly",
        before: "readonly",
        afterEach: "readonly",
        after: "readonly",
        expect: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
  {
    files: ["**/__tests__/**/*.{js,jsx,ts,tsx}", "**/*.test.{js,jsx,ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.jest,
        require: "readonly",
      },
    },
    rules: {
      "no-undef": "off",
    },
  },
];
