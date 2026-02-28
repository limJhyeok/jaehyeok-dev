import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  // Backend: Node.js ES modules
  {
    files: ["api/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.node,
    },
  },

  // Frontend: Browser + CDN globals (marked, KaTeX, highlight.js)
  {
    files: ["public/scripts/**/*.js"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.browser,
        marked: "readonly",
        renderMathInElement: "readonly",
        hljs: "readonly",
      },
    },
  },
]);
