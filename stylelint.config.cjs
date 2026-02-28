module.exports = {
  extends: ["stylelint-config-standard"],
  rules: {
    // Component-scoped selectors don't actually conflict; the rule fires false
    // positives when CSS is organized by component rather than by specificity order.
    "no-descending-specificity": null,
    // Allow BEM modifier syntax (e.g. .block--modifier)
    "selector-class-pattern": [
      "^([a-z][a-z0-9]*)(-[a-z0-9]+)*(--[a-z0-9]+(-[a-z0-9]+)*)?$",
      { message: "Expected class selector to be BEM (kebab-case with optional --modifier)" },
    ],
  },
};
